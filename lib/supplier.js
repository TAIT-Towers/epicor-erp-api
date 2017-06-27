'use strict'

const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.VendorSvc'

class Supplier extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Vendor', 'VendorNum')
  }
}

module.exports = Supplier
