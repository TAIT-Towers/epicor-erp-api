const FindStream = require('./utils/FindStream');

class ServiceBase {
  constructor(connection, serviceName, datasetName, idField) {
    this.connection = connection;
    this.serviceName = serviceName;
    this.datasetName = datasetName;
    this.idField = idField;
    this._getFromResponse = r => r.parameters.ds[this.datasetName][0];
  }

  makeRequest(method, parameters, company) {
    return this.connection.makeRequest(
      this.serviceName,
      method,
      parameters,
      company
    );
  }

  create(record, bpmData) {
    console.log(`Project.create BPM Data: ${bpmData}`);
    return this.makeRequest('GetNew' + this.datasetName, {
      ds: {
        [this.datasetName]: []
      }
    })
      .then(this._getFromResponse)
      .then(defaults =>
        this.makeRequest(
          'Update',
          {
            ds: {
              [this.datasetName]: [
                {
                  ...defaults,
                  ...record,
                  RowMod: 'A'
                }
              ]
            }
          },
          // include the company if provided on the record
          record.Company || null,
          bpmData
        )
      )
      .then(this._getFromResponse);
  }

  /**
   * Update a record.  The record must have the original values from the record, because Epicor will throw an error if
   * some of the fields are missing.
   */
  update(record) {
    const payload = {
      ...record,
      RowMod: 'U'
    };
    // delete payload['SysRevID']
    return this.makeRequest('Update', {
      ds: {
        [this.datasetName]: [payload]
      }
    }).then(this._getFromResponse);
  }

  remove(recordId) {
    const queryField =
      this.idField[0].toLowerCase() + this.idField.substring(1);
    return this.makeRequest('DeleteByID', {
      [queryField]: recordId
    });
  }

  /**
   * Retrieve a single record.  Return null if not found.
   */
  get(selector) {
    const queryField =
      this.idField[0].toLowerCase() + this.idField.substring(1);
    return this.makeRequest('GetByID', {
      [queryField]: selector[this.idField]
    }).then(
      result => result.returnObj[this.datasetName][0],
      err => (err.statusCode === 404 ? null : Promise.reject(err))
    );
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
    return new FindStream(
      this._getRows.bind(this),
      where,
      pageSize,
      limit,
      this.idField
    );
  }

  /**
   * Run a GetList call using odata
   * This allows the payload to be limited, but the response has no paging information so
   * this can only retrieve one page of data
   *
   * @param where String - optional filter (must be in odata syntax)
   * @param fields String - optional comma separated list of fields
   * @param orderBy String
   * @param limit Number - required, max number of records to retrieve
   * @param listMethod String - can be specified if the default (pluralized dataset name) is not
   * correct for the service
   */
  list(
    where,
    fields = '',
    {orderBy = '', limit = 100, listMethod = '', extraParams = {}} = {}
  ) {
    if (!listMethod)
      listMethod =
        this.datasetName +
        (this.datasetName[this.datasetName.length - 1] === 's' ? '' : 's');
    return this.connection.odata(this.serviceName, listMethod, {
      $filter: where || undefined,
      $select: fields,
      $top: limit,
      $orderby: orderBy,
      ...extraParams
    });
  }

  getRevId(record) {
    return record.SysRevID;
  }

  findUpdated(revId) {
    return this.find('SysRevID > ' + (revId || '1') + ' BY SysRevID');
  }

  compareRevId({SysRevID: a}, {SysRevID: b}) {
    return a - b;
  }

  /**
   * Low level method for requesting a page of rows.
   * Depending on the service, this may need to use GetList or the more complex GetRows method.
   * This can be overridden by subclasses to implement custome GetRows method.
   */
  _getRows(where, pageSize, currentPage) {
    return this.makeRequest('GetList', {
      whereClause: where,
      pageSize: pageSize,
      absolutePage: currentPage
    }).then(results => {
      if (
        !results.parameters ||
        !results.returnObj ||
        !results.returnObj[this.datasetName + 'List']
      ) {
        throw new Error('Invalid response from request');
      }
      return {
        dataset: results.returnObj,
        morePage: results.parameters.morePage
      };
    });
  }
}

module.exports = ServiceBase;
