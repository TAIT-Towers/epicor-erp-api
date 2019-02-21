const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.BO.POSvc';

class PurchaseOrder extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'POHeader', 'poNum');
    }

    // Overriding the default get call.
    // I don't just want the POHeader, I want PODetail as well. 
    get(selector) {
        const queryField =
            this.idField[0].toLowerCase() + this.idField.substring(1);
        return this.makeRequest('GetByID', {
            [queryField]: selector[this.idField]
        }).then(
            result => result.returnObj,
            err => (err.statusCode === 404 ? null : Promise.reject(err))
        );
    }
}

module.exports = PurchaseOrder;