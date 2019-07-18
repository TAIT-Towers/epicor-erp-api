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
  list(query, {filter = '', orderBy, limit, extraParams}) {
    return this.service.list(filter, '', {
      listMethod: query,
      limit: limit || 0,
      orderBy,
      extraParams
    });
  }
}

module.exports = BAQ;
