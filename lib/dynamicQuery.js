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

    /**
     * Retrieve a single record.  Return null if not found.
     */
    async get(selector) {
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

module.exports = DynamicQuery;