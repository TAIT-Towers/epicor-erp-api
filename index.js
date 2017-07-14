const Customer = require('./lib/customer'),
  Currency = require('./lib/currency'),
  Employee = require('./lib/employee'),
  Supplier = require('./lib/supplier'),
  SalesTerritory = require('./lib/salesTerritory'),
  ServiceBase = require('./lib/serviceBase'),
  Connection = require('./lib/connection')

const identity = x => x

function Epicor({serverUrl, username, password, company, strictSSL}, serviceAdapter = identity) {
  const connection = new Connection({serverUrl, username, password, company, strictSSL})

  this.getConnection = () => connection
  this.Currency = serviceAdapter(new Currency(connection))
  this.Customer = serviceAdapter(new Customer(connection))
  this.PerCon = serviceAdapter(new ServiceBase(connection, 'Erp.BO.PerConSvc', 'PerCon', 'PerConID'))
  this.SalesTerritory = serviceAdapter(new SalesTerritory(connection))
  this.ShipVia = serviceAdapter(new ServiceBase(connection, 'Erp.BO.ShipViaSvc', 'ShipVia', 'ShipViaCode'))
  this.Supplier = serviceAdapter(new Supplier(connection))
  this.Terms = serviceAdapter(new ServiceBase(connection, 'Erp.BO.TermsSvc', 'Terms', 'TermsCode'))
  this.Employee = serviceAdapter(new Employee(connection))
}

module.exports = Epicor
