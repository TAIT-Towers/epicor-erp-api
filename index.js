const Customer = require('./lib/customer'),
  Currency = require('./lib/currency'),
  Employee = require('./lib/employee'),
  UserFile = require('./lib/userFile'),
  ResourceGroup = require('./lib/resourceGroup'),
  Supplier = require('./lib/supplier'),
  SalesTerritory = require('./lib/salesTerritory'),
  Jobs = require('./lib/jobs'),
  JobOperations = require('./lib/jobOperations'),
  ServiceBase = require('./lib/serviceBase'),
  Labor = require('./lib/labor'),
  SalesOrder = require('./lib/salesOrder'),
  BAQ = require('./lib/baq'),
  Connection = require('./lib/connection')

const identity = x => x

function Epicor({serverUrl, username, password, company, strictSSL}) {
  const connection = new Connection({serverUrl, username, password, company, strictSSL})

  this.getConnection = () => connection
  this.Currency = new Currency(connection)
  this.Customer = new Customer(connection)
  this.Indirect = new ServiceBase(connection, 'Erp.BO.IndirectSvc', 'Indirect', 'IndirectCode')
  this.PerCon = new ServiceBase(connection, 'Erp.BO.PerConSvc', 'PerCon', 'PerConID')
  this.ResourceGroup = new ResourceGroup(connection)
  this.SalesTerritory = new SalesTerritory(connection)
  this.ShipVia = new ServiceBase(connection, 'Erp.BO.ShipViaSvc', 'ShipVia', 'ShipViaCode')
  this.Supplier = new Supplier(connection)
  this.Terms = new ServiceBase(connection, 'Erp.BO.TermsSvc', 'Terms', 'TermsCode')
  this.Employee = new Employee(connection)
  this.Project = new ServiceBase(connection, 'Erp.BO.ProjectSvc', 'Project', 'ProjectID')
  this.SalesOrder = new SalesOrder(connection)
  this.UserFile = new UserFile(connection)
  this.JobOperations = new JobOperations(connection)
  this.Jobs = new Jobs(connection)
  this.Labor = new Labor(connection)
  this.BAQ = new BAQ(connection)
  this.Company = new ServiceBase(connection, 'Erp.BO.CompanySvc', 'Company', 'Company')
}

module.exports = Epicor
