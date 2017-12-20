const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.CompanySvc'
/**
 * Company service wrapper
 */
class Company extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Company', 'Company')
  }

  list(where, fields, params = {}) {
    return super.list(where, fields, { ...params, listMethod: 'Companies' })
  }
}

module.exports = Company
