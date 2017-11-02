const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.JobOperSearchSvc'

class JobOperations extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'JobOperList', 'OprSeq')
  }

  list(where, fields, options = {}) {
    return super.list(where, fields, {...options, listMethod: 'JobOperSearches'})
  }
}

module.exports = JobOperations
