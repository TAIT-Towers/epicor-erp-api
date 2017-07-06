const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.CurrencySvc'

class Currency extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Currency', 'CurrencyCode')
  }

  getRevId(record) {
    return record.SysRowID
  }

  findUpdated(revId) {
    // there is no SysRevID on currency
    return this.find('')
  }
}

module.exports = Currency
