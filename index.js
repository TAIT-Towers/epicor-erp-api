const Customer = require('./lib/customer'),
  Currency = require('./lib/currency'),
  Supplier = require('./lib/supplier'),
  SalesTerritory = require('./lib/salesTerritory'),
  ServiceBase = require('./lib/serviceBase'),
  Connection = require('./lib/connection')

const identity = x => x

function Epicor({serverUrl, username, password, company, strictSSL}, serviceAdapter = identity) {
  const connection = new Connection({serverUrl, username, password, company, strictSSL})

  this.getConnection = () => connection
  this.Customer = serviceAdapter(new Customer(connection))
  this.Currency = serviceAdapter(new Currency(connection))
  this.Supplier = serviceAdapter(new Supplier(connection))
  this.SalesTerritory = serviceAdapter(new SalesTerritory(connection))
  this.Terms = serviceAdapter(new ServiceBase(connection, 'Erp.BO.TermsSvc', 'Terms', 'TermsCode'))
}

module.exports = Epicor
