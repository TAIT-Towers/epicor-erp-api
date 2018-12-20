const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.BO.POSvc';

class PurchaseOrder extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'POHeader', 'poNum');
    }
}

module.exports = PurchaseOrder;