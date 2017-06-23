'use strict'

const defaults = {
}
const SERVICE = 'Erp.Bo.CustomerSvc'

module.exports = function createCustomer(connection, customer) {
  const payload = {...defaults, ...customer}
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

  })
}
