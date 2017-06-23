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
      return this.connection._makeRequest(SERVICE, 'Update', payload).then(result => {
        return result.parameters.ds.Customer[0].CustNum
      })
    })
  }
}

module.exports = Customer
