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
    super(connection, SERVICE, 'CustomerList')
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
    const payload = defaultTerritory.parameters
    Object.assign(payload.ds.Customer[0], defaults, customer, {RowMod: 'A'})
    const result = await this.makeRequest('Update', payload)
    return result.parameters.ds.Customer[0].CustNum
  }

  /**
   * Update a customer record.  The record must have the original values from the record
   */
  async update(customer, {checkRevId = false} = {}) {
    const existing = await this.get(customer.CustNum)
    if(checkRevId && existing.SysRevID > customer.SysRevID) {
      throw new Error('Record has been modified')
    }
    const payload = {...existing, ...customer, RowMod: 'U'}
    delete payload['SysRevID']
    await this.makeRequest('Update', payload)
  }

  find(where, options) {
    return this.connection.find(this.service, this.returnObjName, where, options)
  }

  /**
   * Retrieve a customer record.  Return null if not found.
   */
  get(custNum) {
    return this.makeRequest('GetByID', {custNum}).then(
      result => result.returnObj.Customer[0],
      err => err.statusCode === 404 ? null : Promise.reject(err))
  }
}

module.exports = Customer
