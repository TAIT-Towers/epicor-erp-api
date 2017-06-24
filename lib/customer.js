'use strict'

const defaults = {
  TermsCode: 'DEF',
  CustomerType: 'CUS',
  CurrencyCode: 'USD'
}
const SERVICE = 'Erp.Bo.CustomerSvc'

class Customer {
  constructor(connection) {
    this.connection = connection
  }

  /**
   * Create a new customer with default territory.  CustID must be specified.
   */
  create(customer) {
    return this.connection._makeRequest(SERVICE, 'GetCustomerTerritory', {
      custNum: 0,
      ds: {
        Customer: [
          {
            Company: this.connection.company
          }
        ]
      }
    }).then(result => {
      const payload = result.parameters
      Object.assign(payload.ds.Customer[0], defaults, customer, {RowMod: 'A'})
      return this.connection.makeRequest(SERVICE, 'Update', payload).then(result => {
        return result.parameters.ds.Customer[0].CustNum
      })
    })
  }

  /**
   * Update a customer record.  The record must have the original values from the record
   */
  update(customer) {
    return this.connection.makeRequest(SERVICE, 'Update', {...customer, RowMod: 'U'})
  }

  /**
   * Run a GetList call to retrieve customer rows.
   *
   * @param where String - condition and sort order.  For example: SysRevID > 444 BY SysRevID.
   * @return event emitter object that will emit a "record" event for each retrieved record.
   * This will automatically page records if there is more than 1 page available.
   */
  find(where, pageSize = 25) {
    return this.connection.find(where, pageSize)
  }
}

module.exports = Customer
