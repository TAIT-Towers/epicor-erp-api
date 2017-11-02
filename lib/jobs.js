const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.JobEntrySvc'

class Jobs extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'JobHeadList', 'JobNum')
  }

  list(where, fields, options = {}) {
    return super.list(where, fields, {...options, listMethod = 'JobEntries'})
  }
}

module.exports = Jobs
