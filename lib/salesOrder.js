const ServiceBase = require('./serviceBase')
const R = require('ramda')

const SERVICE = 'Erp.Bo.SalesOrderSvc'

class Jobs extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'OrderHed', 'OrderNum')
  }

  /**
   * Create an order and related order lines.
   * If provided, the OrderDtl array in the order parameter will be added as line items.
   */
  async create(order) {
    const result = await super.create(R.omit(['OrderDtl'], order))
    if(order.OrderDtl) {
      result.OrderDtl = []
      for(let dtl of order.OrderDtl) {
        const { parameters: { ds } } = await this.makeRequest('GetNewOrderDtl', {
          ds: {},
          orderNum: result.OrderNum
        })
        const newDetail = (await this.makeRequest('Update', {
          ds: {
            OrderDtl: [{
              ...ds.OrderDtl[0],
              ...dtl
            }]
          }
        })).parameters.ds.OrderDtl[0]
        result.OrderDtl.push(newDetail)
      }
    }
    return result
  }

  /**
   * Set order release as "make direct"
   */
  async changeMake(orderNum, ipMake) {
    let ds = (await this.makeRequest('GetByID', {orderNum})).returnObj
    if(ds.OrderRel.length === 0) {
      throw new Error('No OrderRel on order # ' + orderNum)
    }
    ds.OrderRel[0].RowMod = 'U'
    ds = (await this.makeRequest('ChangeMake', {
      ipMake,
      ds
    })).parameters.ds
    ds = (await this.makeRequest('Update', {
      ds
    })).parameters.ds
    return ds
  }
}

module.exports = Jobs
