const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.JobEntrySvc'

/**
 * Service used to run BAQ
 */
class BAQ {
  constructor(connection) {
    this.service = new ServiceBase(connection, 'BaqSvc')
  }

  /**
   * Retrieve data using a pre-defined BAQ
   *
   * @param query String - the BAQ name
   */
  list(query, { filter = '', orderBy, limit = 1000 }) {
    return this.service.list(filter, '', {
      listMethod: query,
      limit,
      orderBy
    })
  }
}

module.exports = BAQ
