const Customer = require('./lib/customer'),
  Supplier = require('./lib/supplier'),
  SalesTerritory = require('./lib/salesTerritory'),
  Connection = require('./lib/connection')

const identity = x => x

function Epicor({serverUrl, username, password, company, strictSSL}, serviceAdapter = identity) {
  const connection = new Connection({serverUrl, username, password, company, strictSSL})

  this.getConnection = () => connection
  this.Customer = serviceAdapter(new Customer(connection))
  this.Supplier = serviceAdapter(new Supplier(connection))
  this.SalesTerritory = serviceAdapter(new SalesTerritory(connection))
}

module.exports = Epicor
