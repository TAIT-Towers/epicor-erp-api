const ServiceBase = require('./serviceBase');
const R = require('ramda');

const SERVICE = 'Erp.Bo.JobEntrySvc';

class Jobs extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'JobHead', 'JobNum');
  }

  list(where, fields, options = {}) {
    return super.list(where, fields, {...options, listMethod: 'JobEntries'});
  }

  /**
   * Create a job.
   * This will call GetNextJobNum to fetch the next available job number.
   */
  async create(record) {
    if (!record.JobNum) {
      const {
        parameters: {opNextJobNum}
      } = await this.makeRequest('GetNextJobNum', {});
      record.JobNum = opNextJobNum;
    }
    const result = await super.create(R.omit(['JobProd'], record));
    if (record.JobProd) {
      result.JobProd = await this.addJobProds(record.JobNum, record.JobProd);
    }
    return result;
  }

  /**
   * Create job prod records.
   * Return array of created job prods.
   */
  async addJobProds(jobNum, jobProds) {
    const result = [];
    for (let jp of jobProds) {
      const {
        parameters: {ds}
      } = await this.makeRequest('GetNewJobProd', {
        ds: {},
        jobNum,
        partNum: jp.PartNum,
        orderNum: jp.OrderNum,
        orderLine: jp.OrderLine,
        orderRelNum: jp.OrderRelNum,
        warehouseCode: jp.WarehouseCode || '',
        targetJobNum: jp.TargetJobNum || '',
        targetAssemblySeq: jp.TargetAssemblySeq || 0
      });
      const newDetail = (await this.makeRequest('Update', {
        ds: {
          JobProd: [
            {
              ...ds.JobProd[0],
              RowMod: 'A'
            }
          ]
        }
      })).parameters.ds.JobProd[0];
      result.push(newDetail);
    }
  }

  async setEngineered(job, isEngineered) {
    const ds = (await this.makeRequest('ChangeJobHeadJobEngineered', {
      ds: {
        JobHead: [
          {
            ...job,
            JobEngineered: isEngineered,
            RowMod: 'U'
          }
        ]
      }
    })).parameters.ds;
    return (await this.makeRequest('Update', {ds})).parameters.ds.JobHead[0];
  }

  async setReleased(job, isReleased) {
    const ds = (await this.makeRequest('ChangeJobHeadJobReleased', {
      ds: {
        JobHead: [
          {
            ...job,
            JobReleased: isReleased,
            RowMod: 'U'
          }
        ]
      }
    })).parameters.ds;
    return (await this.makeRequest('Update', {ds})).parameters.ds.JobHead[0];
  }

  async getDetails(record) {
    new SimpleSchema({
      currJobNum: String,
      currAsmSeq: Number
    }).validate(record);

    return (await this.makeRequest('GetDetails', {
      currJobNum: record.currJobNum,
      currAsmSeq: record.currAsmSeq,
      sourceFile: record.sourceFile || '',
      sourceQuote: record.sourceQuote || 0,
      sourceLine: record.sourceLine || 0,
      sourceJob: record.sourceJob || '',
      sourceAsm: record.sourceAsm || 0,
      sourcePart: record.sourcePart || '',
      sourceRev: record.sourceRev || '',
      sourceAltMethod: record.sourceAltMethod || '',
      resequence: record.resequence || true,
      useMethodForParts: record.useMethodForParts || false,
      getCostsFromInv: record.getCostsFromInv || false,
      getCostsFromTemp: record.getCostsFromTemp || false
    })).returnObj;
  }
}

module.exports = Jobs;
