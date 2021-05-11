const Customer = require('./lib/customer'),
  Company = require('./lib/company'),
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
  LaborApproval = require('./lib/laborApproval'),
  SalesOrder = require('./lib/salesOrder'),
  Task = require('./lib/task'),
  OrderJobWiz = require('./lib/orderJobWiz'),
  BAQ = require('./lib/baq'),
  Connection = require('./lib/connection'),
  PurchaseOrder = require('./lib/purchaseOrder'),
  DynamicQuery = require('./lib/dynamicQuery'),
  Project = require('./lib/project'),
  UD15 = require('./lib/ud15'),
  JobProdSearch = require('./lib/jobProdSearch'),
  Part = require('./lib/part'),
  JobClosing = require('./lib/jobClosing'),
  JobAdjustment = require('./lib/jobAdjustment');

function Epicor({ serverUrl, username, password, company, strictSSL }) {
  const connection = new Connection({
    serverUrl,
    username,
    password,
    company,
    strictSSL
  });

  this.getConnection = () => connection;
  this.setConnectionCompany = company => {
    connection.company = company;
  };
  this.getConnectionCompany = () => connection.company;
  this.Currency = new Currency(connection);
  this.Customer = new Customer(connection);
  this.Indirect = new ServiceBase(
    connection,
    'Erp.BO.IndirectSvc',
    'Indirect',
    'IndirectCode'
  );
  this.Reason = new ServiceBase(
    connection,
    'Erp.BO.ReasonSvc',
    'Reason',
    'ReasonCode'
  );
  this.PerCon = new ServiceBase(
    connection,
    'Erp.BO.PerConSvc',
    'PerCon',
    'PerConID'
  );
  this.Image = new ServiceBase(
    connection,
    'Erp.BO.ImageSvc',
    'Image',
    'ImageID'
  );
  this.ResourceGroup = new ResourceGroup(connection);
  this.SalesTerritory = new SalesTerritory(connection);
  this.ShipVia = new ServiceBase(
    connection,
    'Erp.BO.ShipViaSvc',
    'ShipVia',
    'ShipViaCode'
  );
  this.Supplier = new Supplier(connection);
  this.Terms = new ServiceBase(
    connection,
    'Erp.BO.TermsSvc',
    'Terms',
    'TermsCode'
  );
  this.Employee = new Employee(connection);
  this.SalesOrder = new SalesOrder(connection);
  this.OrderJobWiz = new OrderJobWiz(connection);
  this.UserFile = new UserFile(connection);
  this.JobOperations = new JobOperations(connection);
  this.Jobs = new Jobs(connection);
  this.Task = new Task(connection);
  this.Labor = new Labor(connection);
  this.LaborApproval = new LaborApproval(connection);
  this.BAQ = new BAQ(connection);
  this.Company = new Company(connection);
  this.PurchaseOrder = new PurchaseOrder(connection);
  this.DynamicQuery = new DynamicQuery(connection);
  this.Project = new Project(connection);
  this.UD15 = new UD15(connection);
  this.JobProdSearch = new JobProdSearch(connection);
  this.Part = new Part(connection);
  this.JobClosing = new JobClosing(connection);
  this.JobAdjustment = new JobAdjustment(connection);
}

module.exports = Epicor;
