const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.BO.JobProdSearchSvc';

class JobProdSearch extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'JobProdSearch', 'JobNum');
    }    
}

module.exports = JobProdSearch;