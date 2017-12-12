const ServiceBase = require('./serviceBase')
const R = require('ramda')

const SERVICE = 'Erp.Bo.OrderJobWizSvc'

class OrderJobWiz extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE)
  }

  async createOrderJobs(orderNum) {
    let ds = (await this.makeRequest('GetMatrix', {
      CurOrderNum: orderNum ,
      CurOrderLine: 0,
      CurOrderRelNum: 0
    })).returnObj
    const JWJobOrderDtl = ds.JWJobOrderDtl
    Object.assign(JWJobOrderDtl[0], {
      JobChkBox: true,
      DetailChkBox: true,
      ReleaseChkBox: true,
      ScheduleChkBox: true,
      RowMod: 'U'
    })
    ds = (await this.makeRequest('CreateJobs', {
      ds: {
        JWJobOrderDtl
      }
    })).parameters.ds
    const jobHead = R.last(ds.JWJobHead)
    return jobHead.JobNum
  }
}

module.exports = OrderJobWiz
