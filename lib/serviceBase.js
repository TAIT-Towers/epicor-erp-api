const { Readable } = require('stream')
const debug = require('debug')('epicor')
const parseDatasetAsRecords = require('./utils/parseDatasetAsRecords')

class ServiceBase {
  constructor(connection, serviceName, datasetName, idField) {
    this.connection = connection
    this.serviceName = serviceName
    this.datasetName = datasetName
    this.idField = idField
    this._getFromResponse = r => r.parameters.ds[this.datasetName][0]
  }

  makeRequest(method, parameters) {
    return this.connection.makeRequest(this.serviceName, method, parameters)
  }

  create(record) {
    return this.makeRequest('GetNew' + this.datasetName, {
      ds: { [this.datasetName]: [] }
    })
      .then(this._getFromResponse)
      .then(defaults => this.makeRequest('Update', {ds: {[this.datasetName]: [{...defaults, ...record, RowMod: 'A'}]}}))
      .then(this._getFromResponse)
  }

  /**
   * Update a record.  The record must have the original values from the record, because Epicor will throw an error if
   * some of the fields are missing.
   */
  update(record) {
    const payload = {...record, RowMod: 'U'}
    delete payload['SysRevID']
    return this.makeRequest('Update', {ds: {[this.datasetName]: [payload]}}).then(this._getFromResponse)
  }

  /**
   * Retrieve a single record.  Return null if not found.
   */
  get(selector) {
    const queryField = this.idField[0].toLowerCase() + this.idField.substring(1)
    return this.makeRequest('GetByID', {[queryField]: selector[this.idField]}).then(
      result => result.returnObj[this.datasetName][0],
      err => err.statusCode === 404 ? null : Promise.reject(err))
  }

  /**
   * Run a GetList call to retrieve rows.
   * This will automatically page records if there is more than 1 page available.
   *
   * @param where String - optional where clause, which can include a sort parameter: "SysRevID > 555 BY SysRevID
   * @param pageSize int
   * @param returnObjName String - the name of the property that holds the results in the resulting returnObj object
   * @return stream of records
   */
  find(where = '', {pageSize = 25, limit = 0} = {}) {
    return new FindStream(this._getRows.bind(this), where, pageSize, limit, this.idField)
  }

  getRevId(record) {
    return record.SysRevID
  }

  findUpdated(revId) {
    return this.find('SysRevID > ' + (revId || '1') + ' BY SysRevID')
  }

  compareRevId({SysRevID: a}, {SysRevID: b}) {
    return a - b
  }

  /**
   * Low level method for requesting a page of rows.
   * Depending on the service, this may need to use GetList or the more complex GetRows method.
   * This can be overridden by subclasses to implement custome GetRows method.
   */
  _getRows(where, pageSize, currentPage) {
    return this.makeRequest('GetList', { whereClause: where, pageSize: pageSize, absolutePage: currentPage })
      .then(results => {
        if(!results.parameters || !results.returnObj || !results.returnObj[this.datasetName + 'List']) {
          throw new Error('Invalid response from request')
        }
        return {
          dataset: results.returnObj,
          morePage: results.parameters.morePage
        }
      })
  }
}

class FindStream extends Readable {
  constructor(getRows, where, pageSize, limit, keyField) {
    super({highWaterMark: pageSize, objectMode: true})
    this.getRows = getRows
    this.pageSize = pageSize
    this.where = where
    this.page = 0
    this.limit = limit
    this.keyField = keyField
    this.isReading = false
    this.numRetrieved = 0
  }

  _read(n) {
    if(!this.isReading) {
      this.isReading = true
      this.startReading()
    }
  }

  startReading() {
    debug('start reading records with where = ' + this.where)
    this.getRows(this.where, this.pageSize, this.page)
      .then(({dataset, morePage}) => {
        const records = parseDatasetAsRecords(dataset, this.keyField)
        debug(`got ${records.length} records`)
        for(let record of records) {
          this.push(record)
          this.numRetrieved++
          if(this.numRetrieved === this.limit) {
            this.push(null)
            return
          }
        }
        if(!morePage) {
          this.push(null)
        } else {
          this.page++
          setImmediate(() => this.startReading())
        }
      }, err => {
        this.emit('error', err)
      })
  }
}

module.exports = ServiceBase
