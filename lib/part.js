const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.BO.PartSvc';

class Part extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'Part', 'PartNum');
    }    
}

module.exports = Part;