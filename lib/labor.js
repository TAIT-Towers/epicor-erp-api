const ServiceBase = require('./serviceBase')

const SERVICE = 'Erp.Bo.LaborSvc'

// labor service - this combines laborhed and labordtl records, so there is a good bit of custom logic
class Labor extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'LaborHed', 'LaborHedSeq')
  }

  _getRows(where, pageSize, currentPage) {
    // we have to use getRows because GetList does not return all the data
    const params = {
      "whereClauseLaborHed": where,
      "whereClauseLaborDtl": "",
      "whereClauseLaborDtlAttch": "",
      "whereClauseLaborDtlComment": "",
      "whereClauseLaborEquip": "",
      "whereClauseLaborPart": "",
      "whereClauseLbrScrapSerialNumbers": "",
      "whereClauseLaborDtlGroup": "",
      "whereClauseSelectedSerialNumbers": "",
      "whereClauseSNFormat": "",
      "whereClauseTimeWeeklyView": "",
      "whereClauseTimeWorkHours": "",
      pageSize,
      'absolutePage': currentPage
    }
    return this.makeRequest('GetRows', params)
      .then(results => ({
        dataset: results.returnObj,
        morePage: results.parameters.morePage
      }))
  }

}

module.exports = Labor
