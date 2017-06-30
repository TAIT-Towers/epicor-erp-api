const ServiceBase = require('./serviceBase')
const SERVICE = 'Erp.Bo.SalesTerSvc'

class SalesTerritory extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'SalesTer', 'TerritoryID')
  }
}

module.exports = SalesTerritory
