'use strict'

const ServiceBase = require('./serviceBase')

const defaults = {
  TermsCode: 'DEF',
  CustomerType: 'CUS',
  CurrencyCode: 'USD'
}
const SERVICE = 'Erp.Bo.CustomerSvc'

class Customer extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Customer', 'CustNum')
  }

  /**
   * Create a new customer with default territory.  CustID must be specified.
   */
  async create(customer) {
    // TODO we should only call the service if there is no territory specified on the source
    const defaultTerritory = await this.makeRequest('GetCustomerTerritory', {
      custNum: 0,
      ds: {
        Customer: [
          {
            Company: this.connection.company
          }
        ]
      }
    })
    const payload = defaultTerritory.parameters.ds.Customer[0]
    const result = await super.create(Object.assign(payload, defaults, customer))
    return result
  }
}

module.exports = Customer
