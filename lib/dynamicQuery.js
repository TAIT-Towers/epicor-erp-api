const ServiceBase = require('./serviceBase');
const R = require('ramda');

const SERVICE = 'Ice.BO.DynamicQuerySvc';

class DynamicQuery extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'QueryExecution', 'QueryID');
    }

    async execute(record){
        const returnObj = await super.makeRequest('ExecuteByID', record);
        return returnObj.returnObj.Results;
    }
}

module.exports = DynamicQuery;