const ServiceBase = require('./serviceBase');

/**
 * Service used to run BAQ
 */
class BAQ {
  constructor(connection) {
    this.service = new ServiceBase(connection, 'BaqSvc');
  }

  /**
   * Retrieve data using a pre-defined BAQ
   *
   * @param query String - the BAQ name
   */
  list(query, {filter = '', orderBy, limit = 1000, extraParams}) {
    return this.service.list(filter, '', {
      listMethod: query,
      limit,
      orderBy,
      extraParams
    });
  }
}

module.exports = BAQ;
