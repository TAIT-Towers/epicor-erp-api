const ServiceBase = require('./serviceBase')

class ResourceGroup extends ServiceBase {
  constructor(connection) {
    super(connection, 'Erp.BO.ResourceGroupSvc', 'ResourceGroup', 'ResourceGrpID')
  }

  _getRows(where, pageSize, currentPage) {
    // we have to use getRows because GetList does not return all the data
    const params = {
      "whereClauseResourceGroup": where,
      "whereClauseResourceGroupAttch": "",
      "whereClauseResource": "",
      "whereClauseCapResLnk": "",
      "whereClauseResourceCal": "",
      pageSize,
      "absolutePage": currentPage
    }
    return this.makeRequest('GetRows', params)
      .then(results => ({
        dataset: results.returnObj,
        morePage: results.parameters.morePage
      }))
  }
}
export default ResourceGroup
