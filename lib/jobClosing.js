const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.BO.JobClosingSvc';

class JobClosing extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'JobClosing', 'JobNum');
    }    
}

module.exports = JobClosing;