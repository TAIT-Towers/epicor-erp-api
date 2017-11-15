const ServiceBase = require('./serviceBase')
const SimpleSchema = require('simpl-schema').default
const moment = require('moment')

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

  /**
   * Create a new LaborDtl entry.
   * The LaborHed entry is created also if a match is not found for the given parameters
   * (date, employeenum, and custom keys in customLaborHedData)
   */
  async addLaborDetail(entry, customLaborHedData, customLaborDtlData) {
    new SimpleSchema({
      EmployeeNum: String,
      PayrollDate: /\d{4}-\d{2}-\d{2}/,
      Hours: Number,
      OprSeq: { type: Number, optional: true },
      JobNum: { type: String, optional: true },
      IndirectCode: { type: String, optional: true },
      Note: { type: String, optional: true }
    }).validate(entry, /* {ignore: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA} */)

    // 1 - find labor hed
    let where = `EmployeeNum='${entry.EmployeeNum}'
    and PayrollDate >= '${entry.PayrollDate}'
    and PayrollDate < '${moment(entry.PayrollDate).add(1, 'days').format('YYYY-MM-DD')}'`
    if(customLaborHedData) {
      where += Object.keys(customLaborHedData)
        .map(k => ` and ${k} = '${customLaborHedData[k].replace(/'/g, "''")}'`)
        .join('')
    }
    // console.log('Using condition', where)
    let {dataset} = await this._getRows(where, 10, 0)
    // do we need other crits?

    // 2 - if no labor hed, create a new one
    if(dataset.LaborHed.length == 0)
      dataset = await this._createLaborHed(entry, customLaborHedData)
    const laborHedSeq = dataset.LaborHed[0].LaborHedSeq

    // 3 - create labor dtl
    dataset = await this._createLaborDtl(entry, laborHedSeq, customLaborDtlData)
    return dataset.LaborDtl[0]
  }

  async updateLaborDetail(entry) {
    new SimpleSchema({
      LaborHedSeq: Number,
      LaborDtlSeq: Number,
      Hours: Number,
      Note: { type: String, optional: true },
    }).validate(entry)
    const ds = (await this.makeRequest('GetByID', {laborHedSeq: entry.LaborHedSeq})).returnObj
    const hed = ds.LaborHed[0]
    const dtl = ds.LaborDtl.filter(v => v.LaborDtlSeq === entry.LaborDtlSeq)[0]
    if(!dtl || !hed)
      throw new Error(`Record id ${entry.LaborHedSeq} / ${entry.LaborDtlSeq} cannot be found`)
    // XXX check for submitted?
    Object.assign(dtl, {
      LaborHrs: entry.Hours,
      BurdenHrs: entry.Hours,
      ClockinTime: 8,
      ClockoutTime: 8 + entry.Hours,
      RowMod: 'U'
    })
    Object.assign(hed, {
      PayHours: entry.Hours,
      ClockInTime: 8,
      ClockOutTime: 8 + entry.Hours,
      ActualClockInTime: 8,
      ActualClockOutTime: 8 + entry.Hours,
      RowMod: 'U'
    })
    return (await this.makeRequest('Update', {ds})).parameters.ds.LaborDtl
      .filter(v => v.LaborDtlSeq === entry.LaborDtlSeq)[0]
  }

  deleteLaborDetail(entry) {
    new SimpleSchema({
      LaborHedSeq: Number,
    }).validate(entry)
    return this.makeRequest('DeleteByID', {laborHedSeq: entry.LaborHedSeq})
  }

  async _createLaborHed(entry, customLaborHedData) {
    const {parameters} = await this.makeRequest('GetNewLaborHed1', {
      ds: {},
      EmployeeNum: entry.EmployeeNum,
      ShopFloor: false,
      payrollDate: entry.PayrollDate
    })
    // TODO add stuff like ClockInDate, etc
    Object.assign(parameters.ds.LaborHed[0], {
      PayHours: entry.Hours,
      ClockInTime: 8,
      ClockOutTime: 8 + entry.Hours,
      ActualClockInTime: 8,
      ActualClockOutTime: 8 + entry.Hours,
      RowMod: 'A'
    })
    if(customLaborHedData)
      Object.assign(parameters.ds.LaborHed[0], customLaborHedData)
    return (await this.makeRequest('Update', parameters)).parameters.ds
  }

  async _createLaborDtl(entry, laborHedSeq, customLaborDtlData) {
    let dataset = (await this.makeRequest('GetNewLaborDtl', {
      ds: {},
      laborHedSeq
    })).parameters.ds
    if(entry.JobNum && entry.OprSeq !== undefined) {
      dataset = (await this.makeRequest('DefaultJobNum', { ds: dataset, jobNum: entry.JobNum })).parameters.ds
      dataset = (await this.makeRequest('DefaultAssemblySeq', { ds: dataset, assemblySeq: 0 })).parameters.ds
      dataset = (await this.makeRequest('DefaultOprSeq', { ds: dataset, oprSeq: entry.OprSeq })).parameters.ds
    } else if(entry.IndirectCode) {
      /*
       * TODO for indirect
       * A new labor detail row will need to be created using Erp.BO.LaborSvc/GetNewLaborDtl. The LaborType field in the new LaborDtlRow will then need to be set into “I”. The portal will need to call the following methods to set the time to indirect:
Erp.BO.LaborSvc/ChangeLaborType(ds)
Erp.BO.LaborSvc/DefaultLaborType(ds, "I")
*/
      dataset = (await this.makeRequest('DefaultIndirect', { ds: dataset, indirectCode: entry.IndirectCode })).parameters.ds
    } else {
      throw new Error('IndirectCode or JobNum/OprSeq must be provided')
    }
    Object.assign(dataset.LaborDtl[0], {
      LaborHrs: entry.Hours,
      BurdenHrs: entry.Hours,
      ClockinTime: 8,
      ClockoutTime: 8 + entry.Hours,
      // EnableSubmit: false,
      // TimeAutoSubmit: false,
      RowMod: 'A'
    })
    if(customLaborDtlData)
      Object.assign(dataset.LaborDtl[0], customLaborDtlData)
    return (await this.makeRequest('Update', { ds: dataset })).parameters.ds
  }

}

module.exports = Labor
