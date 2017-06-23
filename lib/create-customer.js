'use strict'

const defaults = {
  TermsCode: 'DEF',
  CustomerType: 'CUS',
  CurrencyCode: 'USD'
}
const SERVICE = 'Erp.Bo.CustomerSvc'

module.exports = function createCustomer(connection, customer) {
  return connection._makeRequest(SERVICE, 'GetCustomerTerritory', {
    custNum: 0,
    ds: {
      Customer: [
        {
          Company: connection.company
        }
      ]
    }
  }).then(result => {
    const payload = result.parameters
    Object.assign(payload.ds.Customer[0], defaults, customer, {RowMod: 'A'})
    return connection._makeRequest(SERVICE, 'Update', payload).then(result => {
      return result.parameters.ds.Customer[0].CustNum
    })
  })
}
