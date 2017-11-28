const ServiceBase = require('./serviceBase')
const SimpleSchema = require('simpl-schema').default
const moment = require('moment')

const SERVICE = 'Erp.Bo.LaborSvc'

// labor service - this combines laborhed and labordtl records, so there is a good bit of custom logic
class Labor extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'LaborHed', 'LaborHedSeq')
  }

  _getRows(where, pageSize, currentPage, whereDtl = '') {
    // we have to use getRows because GetList does not return all the data
    const params = {
      "whereClauseLaborHed": where,
      "whereClauseLaborDtl": whereDtl,
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
   * (date, employeenum, and custom keys in customLaborHedData).
   * Return dataset with LaborHed and LaborDtl (both arrays with 1 entry).
   * If the Hours passed is not specified, the detail record will not be created and we will only create the header
   * (in that case if there is a matching header we'll just return it)
   */
  async addLaborEntry(entry, customLaborHedData, customLaborDtlData) {
    // console.log(entry)
    new SimpleSchema({
      EmployeeNum: String,
      PayrollDate: /\d{4}-\d{2}-\d{2}/,
      Hours: { type: Number, optional: true },
      OprSeq: { type: Number, optional: true },
      JobNum: { type: String, optional: true },
      IndirectCode: { type: String, optional: true },
      Note: { type: String, optional: true }
    }).validate(entry, /* {ignore: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA} */)

    let dataset = await this._findOrCreateLaborHed(entry, customLaborHedData)
    const laborHedSeq = dataset.LaborHed[0].LaborHedSeq

    // 3 - create labor dtl
    if(entry.Hours > 0) {
      dataset = await this._createLaborDtl(entry, laborHedSeq, customLaborDtlData)
    }
    return dataset
  }

  /**
   * Update an existing LaborDetail object.  Return dataset with LaborHed and LaborDtl (both arrays
   * with 1 entry each)
   *
   * If customLaborHedData is provided, and a LaborDtlSeq was passed,
   * we'll check to make sure it matches the existing LaborHed record, if it doesn't,
   * we'll delete the previous entry and create a new one with that data then move the detail record to that new header.
   */
  async updateLaborEntry(entry, customLaborHedData) {
    console.log("updateLaborEntry", {entry, customLaborHedData})
    new SimpleSchema({
      LaborHedSeq: Number,
      // pass a 0, to skip updating the LaborDtl object
      LaborDtlSeq: Number,
      Hours: { type: Number, optional: true },
    }).validate(entry)
    let ds = (await this.makeRequest('GetByID', {laborHedSeq: entry.LaborHedSeq})).returnObj
    let hed = ds.LaborHed[0]
    const dtl = ds.LaborDtl.filter(v => v.LaborDtlSeq === entry.LaborDtlSeq)[0]
    if(!hed)
      throw new Error(`LaborHed id ${entry.LaborHedSeq} cannot be found`)
    if(!dtl && entry.LaborDtlSeq)
      throw new Error(`LaborDtl id ${entry.LaborHedSeq} / ${entry.LaborDtlSeq} cannot be found`)
    // updates that are applied to LaborHed
    if(customLaborHedData && !_compareHedData(hed, customLaborHedData)) {
      if(dtl) {
        // move entry to new labor head!
        // we need to:
        // - create new header, or locate existing one
        ds = await this._findOrCreateLaborHed({
          PayrollDate: hed.PayrollDate,
          EmployeeNum: hed.EmployeeNum,
        }, customLaborHedData)
        dtl.LaborHedSeq = ds.LaborHed[0].LaborHedSeq
      } else {
        // just update the existing header data, if we are not dealing with detail entries
        Object.assign(hed, {
          ...customLaborHedData,
          RowMod: 'U'
        })
      }
    }
    // updates that are applied to LaborDtl
    if(dtl) {
      if(entry.Hours !== undefined) {
        Object.assign(dtl, {
          LaborHrs: entry.Hours,
          BurdenHrs: entry.IndirectCode ? 0 : entry.Hours,
        })
      }
      dtl.RowMod = 'U'
      ds.LaborDtl = [dtl]
    }
    // I think it will calculate those for me?
    // ClockinTime: 8,
    // ClockoutTime: 8 + entry.Hours,
    return (await this.makeRequest('Update', {ds})).parameters.ds
  }

  /**
   * Delete an entry by LaborHedSeq and/or LaborDtlSeq.
   * If the LaborHed record becomes empty, we'll delete it too.
   */
  async deleteLaborEntry(entry) {
    new SimpleSchema({
      LaborHedSeq: Number,
      // pass 0 to delete all detail records under the header
      LaborDtlSeq: Number
    }).validate(entry, {ignore: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA})
    const {LaborHedSeq, LaborDtlSeq} = entry
    const whereDtl = LaborDtlSeq > 0 ? `LaborDtlSeq='${LaborDtlSeq}'` : ''
    const {dataset} = await this._getRows(`LaborHedSeq='${LaborHedSeq}'`, 100, 0, whereDtl)
    dataset.LaborDtl.forEach(dtl => {
      dtl.RowMod = 'D'
    })
    if(dataset.LaborHed.length === 1 && (
      entry.LaborDtlSeq <= 0 ||
      (dataset.LaborDtl.length === 1 && dataset.LaborDtl[0].LaborHrs === dataset.LaborHed[0].PayHours))
    ) {
      // > 1 => we are deleting by LaborHedSeq only, so all the detail records will have been deleted
      dataset.LaborHed[0].RowMod = 'D'
    }
    // the hours on the LaborHed record will be updated automatically, if not deleted
    return this.makeRequest('Update', {ds: dataset})
  }

  /**
   * Delete all entries within a row
   */
  async deleteRow(rowCriteria) {
    const [where, whereDtl] = _buildWhereRow(rowCriteria)
    // console.log('deleteWhere', { where, whereDtl })
    const {dataset} = await this._getRows(where, 100, 0, whereDtl.join(' and '))
    if(dataset.LaborDtl.length) {
      dataset.LaborDtl.forEach(ld => {
        ld.RowMod = 'D'
      })
      dataset.LaborHed.forEach(hed => {
        const dtls = dataset.LaborDtl.filter(d => d.LaborHedSeq === hed.LaborHedSeq)
        const totalHours = dtls.reduce((acc, dtl) => acc + dtl.LaborHrs, 0)
        // if the hours match then we can delete the header.
        // otherwise, they may have another entry (perhaps for another project)
        if(totalHours >= hed.TotLbrHrs) {
          // hed.RowMod = 'D'
          // this seems to cause a transaction error... probably best to just leave those there
          // since we'll pick them up when adding new entries
        }
      })
      return this.makeRequest('Update', {ds: dataset})
    }
    return false
  }

  /**
   * Update all entries within a row (this should only be used for detail changes, because we won't move entries to a different header)
   */
  async updateRow(rowCriteria, newDtlValues) {
    const [where, whereDtl] = _buildWhereRow(rowCriteria)
    // console.log('deleteWhere', { where, whereDtl })
    const {dataset} = await this._getRows(where, 100, 0, whereDtl.join(' and '))
    if(dataset.LaborDtl.length) {
      dataset.LaborDtl.forEach(ld => {
        Object.assign(ld, {
          ...newDtlValues, RowMod: 'U'
        })
      })
      return this.makeRequest('Update', {ds: dataset})
    }
    return false
  }

  async submitTimesheet(whereObject) {
    new SimpleSchema({
      FromDate: /\d{4}-\d{2}-\d{2}/,
      ToDate: /\d{4}-\d{2}-\d{2}/,
      EmployeeNum: String,
    }).validate(whereObject)
    const [where] = _buildWhereRow(whereObject)
    let {dataset} = await this._getRows(where, 100, 0)
    if(dataset.LaborDtl.length) {
      dataset.LaborDtl.forEach(ld => {
        Object.assign(ld, {
          EnableSubmit: true,
          TimeAutoSubmit: true,
          RowMod: 'U'
        })
      })
      // console.log('Before updates', require('util').inspect(dataset.LaborDtl, false, null))
      dataset = (await this.makeRequest('Update', {ds: dataset})).parameters.ds
      dataset.LaborDtl.forEach(ld => Object.assign(ld, { RowMod: 'U' }))
      dataset = (await this.makeRequest('SubmitForApproval', {ds: dataset, lWeeklyView: false})).parameters.ds
      // console.log('After submit', require('util').inspect(dataset.LaborDtl, false, null))
      dataset = (await this.makeRequest('Update', {ds: dataset})).parameters.ds
      // console.log('After last update', require('util').inspect(dataset.LaborDtl, false, null))
      return dataset
    }
    return false
  }

  async recallTimesheet(whereObject) {
    new SimpleSchema({
      FromDate: /\d{4}-\d{2}-\d{2}/,
      ToDate: /\d{4}-\d{2}-\d{2}/,
      EmployeeNum: String,
    }).validate(whereObject)
    const [where] = _buildWhereRow(whereObject)
    let {dataset} = await this._getRows(where, 100, 0)
    if(dataset.LaborDtl.length) {
      dataset.LaborDtl.forEach(ld => Object.assign(ld, { RowMod: 'U' }))
      dataset = (await this.makeRequest('RecallFromApproval', {ds: dataset, lWeeklyView: false})).parameters.ds
      dataset = (await this.makeRequest('Update', {ds: dataset})).parameters.ds
      return dataset
    }
    return false
  }

  async _findOrCreateLaborHed(entry, customLaborHedData) {
    // 1 - find labor hed
    let where = `EmployeeNum='${entry.EmployeeNum}'
    and PayrollDate >= '${entry.PayrollDate}'
    and PayrollDate < '${moment(entry.PayrollDate).add(1, 'days').format('YYYY-MM-DD')}'`
    if(customLaborHedData) {
      where += Object.keys(customLaborHedData)
        .map(k => ` and ${k} = '${customLaborHedData[k].replace(/'/g, "''")}'`)
        .join('')
    }
    // console.log('_findOrCreateLaborHed, using where', where)
    let {dataset} = await this._getRows(where, 10, 0)
    // console.log('_findOrCreateLaborHed, got dataset', dataset.LaborHed.length)
    // do we need other crits?

    // 2 - if no labor hed, create a new one
    if(dataset.LaborHed.length == 0) {
      dataset = await this._createLaborHed(entry, customLaborHedData)
    }
    return dataset
  }

  /**
   * Create a LaborHed record.
   * Save to Epicor, and return dataset.
   */
  async _createLaborHed(entry, customLaborHedData) {
    const {parameters} = await this.makeRequest('GetNewLaborHed1', {
      ds: {},
      EmployeeNum: entry.EmployeeNum,
      ShopFloor: false,
      payrollDate: entry.PayrollDate
    })
    // TODO add stuff like ClockInDate, etc
    Object.assign(parameters.ds.LaborHed[0], {
      // we don't need that, the system will calculate for us :)
      // PayHours: entry.Hours,
      // ClockInTime: 8,
      // ClockOutTime: 8 + entry.Hours,
      // ActualClockInTime: 8,
      // ActualClockOutTime: 8 + entry.Hours,
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
      dataset = (await this.makeRequest('ChangeLaborType', { ds: dataset })).parameters.ds
      dataset = (await this.makeRequest('DefaultLaborType', { ds: dataset, ipLaborType: 'I' })).parameters.ds
      dataset = (await this.makeRequest('ChangeIndirectCode', { ds: dataset })).parameters.ds
      dataset = (await this.makeRequest('DefaultIndirect', { ds: dataset, indirectCode: entry.IndirectCode })).parameters.ds
    } else {
      // throw new Error('IndirectCode or JobNum/OprSeq must be provided')
    }
    Object.assign(dataset.LaborDtl[0], {
      LaborHrs: entry.Hours,
      BurdenHrs: entry.IndirectCode ? 0 : entry.Hours,
      // Clockin / Clockout time seem to be automatically determined by the system.
      // When there are more than 1 entries in a day it does not work well... but it does not seem to cause any issue (in the UI at least)
      // ClockinTime: 8,
      // ClockoutTime: 8 + entry.Hours,
      // EnableSubmit: false,
      // TimeAutoSubmit: false,
      RowMod: 'A'
    })
    if(customLaborDtlData)
      Object.assign(dataset.LaborDtl[0], customLaborDtlData)
    return (await this.makeRequest('Update', { ds: dataset })).parameters.ds
  }

  /**
   * Recalculate totals for each LaborHed record in the dataset.
   * The ones that don't have any matching detail entry will be deleted.
   */
  _recalculateLaborHedTotals(dataset) {
  }
}

// Utility functions

// Build a [where, whereDtl] condition based on some pre-defined fields
function _buildWhereRow(rowCriteria) {
  new SimpleSchema({
    FromDate: /\d{4}-\d{2}-\d{2}/,
    ToDate: /\d{4}-\d{2}-\d{2}/,
    EmployeeNum: String,
    JobNum: { type: String, optional: true },
    OprSeq: { type: Number, optional: true },
    IndirectCode: { type: String, optional: true },
  }).validate(rowCriteria)
  const {FromDate, ToDate, EmployeeNum, JobNum, OprSeq, IndirectCode} = rowCriteria
  const whereDtl = []
  if(JobNum)
    whereDtl.push(`JobNum = '${JobNum}'`)
  if(OprSeq)
    whereDtl.push(`OprSeq = '${OprSeq}'`)
  if(IndirectCode)
    whereDtl.push(`IndirectCode = '${IndirectCode}'`)
  const where = `EmployeeNum = '${EmployeeNum}'
    and PayrollDate < '${moment(ToDate).add(1, 'day').format('YYYY-MM-DD')}'
    and PayrollDate >= '${moment(FromDate).format('YYYY-MM-DD')}'`
  return [where, whereDtl]
}

function _compareHedData(header, newHeaderData) {
  for(let k in newHeaderData) {
    if(header[k] !== newHeaderData[k])
      return false
  }
  return true
}

module.exports = Labor
