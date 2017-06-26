const { Readable } = require('stream')

class ServiceBase {
  constructor(connection, serviceName, returnObjName) {
    this.connection = connection
    this.serviceName = serviceName
    this.returnObjName = returnObjName
  }

  makeRequest(method, parameters) {
    return this.connection.makeRequest(this.serviceName, method, parameters)
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
    return new FindStream(this, this.returnObjName, where, pageSize, limit)
  }
}

class FindStream extends Readable {
  constructor(connection, returnObjName, where, pageSize, limit) {
    super({highWaterMark: pageSize, objectMode: true})
    this.connection = connection
    this.returnObjName = returnObjName
    this.pageSize = pageSize
    this.where = where
    this.page = 0
    this.limit = limit
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
    this.connection.makeRequest('GetList', {
      whereClause: this.where, pageSize: this.pageSize, absolutePage: this.page
    }).then(results => {
      if(!results.parameters || !results.returnObj || !results.returnObj[this.returnObjName]) {
        this.emit('error', new Error('Invalid response from request'))
      } else {
        const records = results.returnObj[this.returnObjName]
        for(let record of records) {
          this.push(record)
          this.numRetrieved++
          if(this.numRetrieved === this.limit) {
            this.push(null)
            return
          }
        }
        if(!results.parameters.morePage) {
          this.push(null)
        } else {
          this.page++
          setImmediate(() => this.startReading())
        }
      }
    }, err => {
      this.emit('error', err)
    })
  }
}

module.exports = ServiceBase
