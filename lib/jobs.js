const ServiceBase = require('./serviceBase')
const R = require('ramda')

const SERVICE = 'Erp.Bo.JobEntrySvc'

class Jobs extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'JobHead', 'JobNum')
  }

  list(where, fields, options = {}) {
    return super.list(where, fields, {...options, listMethod: 'JobEntries'})
  }

  /**
   * Create a job.
   * This will call GetNextJobNum to fetch the next available job number.
   */
  async create(record) {
    if(!record.JobNum) {
      const { parameters: { opNextJobNum } } = await this.makeRequest('GetNextJobNum', {})
      record.JobNum = opNextJobNum
    }
    const result = await super.create(R.omit(['JobProd'], record))
    if(record.JobProd) {
      result.JobProd = await this.addJobProds(record.JobNum, record.JobProd)
    }
    return result
  }

  /**
   * Create job prod records.
   * Return array of created job prods.
   */
  async addJobProds(jobNum, jobProds) {
    const result = []
    for(let jp of jobProds) {
      const { parameters: { ds } } = await this.makeRequest('GetNewJobProd', {
        ds: {},
        jobNum,
        "partNum": jp.PartNum,
        "orderNum": jp.OrderNum,
        "orderLine": jp.OrderLine,
        "orderRelNum": jp.OrderRelNum,
        "warehouseCode": jp.WarehouseCode || "",
        "targetJobNum": jp.TargetJobNum || "",
        "targetAssemblySeq": jp.TargetAssemblySeq || 0
      })
      const newDetail = (await this.makeRequest('Update', {
        ds: {
          JobProd: [{
            ...ds.JobProd[0],
            ...jp
          }]
        }
      })).parameters.ds.JobProd[0]
      result.push(newDetail)
    }
  }
}

module.exports = Jobs
