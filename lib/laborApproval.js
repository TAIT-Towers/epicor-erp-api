const ServiceBase = require('./serviceBase');
const SimpleSchema = require('simpl-schema').default;
const moment = require('moment');

const SERVICE = 'Erp.Bo.LaborApprovalSvc';

// Build a where condition based on some pre-defined fields
const buildWhere = criteria => {
  new SimpleSchema({
    FromDate: /\d{4}-\d{2}-\d{2}/,
    ToDate: /\d{4}-\d{2}-\d{2}/,
    EmployeeNum: String,
    JobNum: {type: String, optional: true},
    OprSeq: {type: Number, optional: true},
    IndirectCode: {type: String, optional: true}
  }).validate(criteria);

  const {
    FromDate,
    ToDate,
    EmployeeNum,
    JobNum,
    OprSeq,
    IndirectCode
  } = criteria;

  const where = [
    `EmployeeNum = '${EmployeeNum}'`,
    `PayrollDate < '${moment(ToDate)
      .add(1, 'day')
      .format('YYYY-MM-DD')}'`,
    `PayrollDate >= '${moment(FromDate).format('YYYY-MM-DD')}'`
  ];
  if (JobNum) {
    where.push(`JobNum = '${JobNum}'`);
  }
  if (OprSeq) {
    where.push(`OprSeq = '${OprSeq}'`);
  }
  if (IndirectCode) {
    where.push(`IndirectCode = '${IndirectCode}'`);
  }

  return where.join(' and ');
};

class LaborApproval extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'LaborDtl', 'LaborDtlSeq');
  }

  _getRows(where, pageSize = 100, currentPage = 0) {
    // we have to use getRows because GetList does not return all the data
    const params = {
      whereClauseLaborDtl: buildWhere(where),
      whereClauseLaborDtlComment: '',
      pageSize,
      absolutePage: currentPage
    };

    return this.makeRequest('GetRows', params).then(({returnObj}) => returnObj);
  }

  async approveTimesheet(
    whereObject,
    {Name: approvedByName, EmployeeNum: approvedById},
    datesToApprove
  ) {
    new SimpleSchema({
      FromDate: /\d{4}-\d{2}-\d{2}/,
      ToDate: /\d{4}-\d{2}-\d{2}/,
      EmployeeNum: String
    }).validate(whereObject);

    let dataset = await this._getRows(whereObject, 100, 0);
    if (dataset.LaborDtl.length) {
      dataset.LaborDtl.forEach(ld => {
        const payrollDate = moment(ld.PayrollDate).format('YYYY-MM-DD');

        if (
          datesToApprove.includes(payrollDate) &&
          !ld.NotSubmitted &&
          !ld.ApprovedDate
        ) {
          Object.assign(ld, {
            ApprovalProjectDesc: ld.ProjectDescription,
            ApprovalProjectID: ld.ProjectID,
            ApprvrHasOpenTask: true,
            ApprovedBy: approvedByName,
            ApprovedDate: moment().format('YYYY-MM-DDT00:00:00'),
            RowMod: 'U'
          });
        }
      });

      dataset = (await this.makeRequest('ApproveReject', {
        ipSalesRepCode: approvedById,
        ipAction: 'A',
        ipComment: '',
        ds: dataset
      })).parameters.ds;

      return dataset;
    }

    return false;
  }
}

module.exports = LaborApproval;
