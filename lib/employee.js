const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.Bo.EmpBasicSvc';

class Employee extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'EmpBasic', 'EmpID');
  }

  _getRows(where, pageSize, currentPage) {
    // we have to use getRows because GetList does not return all the data
    const params = {
      whereClauseEmpBasic: where,
      whereClauseEmpBasicAttch: '',
      whereClauseEmpLabExpRate: '',
      whereClauseEmpCal: '',
      whereClauseMESMenuSecurity: '',
      whereClausePartner: '',
      whereClauseResourceCal: '',
      whereClauseEmpRole: '',
      whereClauseEntityGLC: '',
      whereClauseEmpRoleRt: '',
      pageSize,
      absolutePage: currentPage
    };
    return this.makeRequest('GetRows', params).then(results => ({
      dataset: results.returnObj,
      morePage: results.parameters.morePage
    }));
  }
}

module.exports = Employee;
