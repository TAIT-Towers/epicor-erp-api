const SimpleSchema = require('simpl-schema').default;
const moment = require('moment');
const R = require('ramda');

const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.Bo.LaborSvc';

const JOB_NUM_CHANGE_PROPERTIES = ['DisplayJob', 'JobType'];
const LABOR_TYPE_CHANGE_PROPERTIES = [
  'BurdenHrs',
  'DisPrjRoleCd',
  'ExpenseCode',
  'ExpenseCodeDescription',
  'IndirectCode',
  'IndirectDescription',
  'JCDept',
  'JCDeptDescription',
  'JobAsmblDescription',
  'LaborType',
  'LaborTypePseudo',
  'MachineDescription',
  'OpDescOpDesc',
  'ProjectDescription',
  'ResourceGrpDescription',
  'ResourceGrpID',
  'ResourceID'
];
const OPR_SEQ_CHANGE_PROPERTIES = [
  'BurdenRate',
  'DiscrepUOM',
  'LaborUOM',
  'OpCode',
  'OpCodeOpDesc',
  'ScrapUOM'
];
const PROJECT_ID_CHANGE_PROPERTIES = ['JobNum', 'OprSeq'];

// labor service - this combines laborhed and labordtl records, so there is a good bit of custom logic
class Labor extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'LaborHed', 'LaborHedSeq');
  }

  _getRows(where, pageSize = 100, currentPage = 0, whereDtl = '') {
    // we have to use getRows because GetList does not return all the data
    const params = {
      whereClauseLaborHed: where,
      whereClauseLaborDtl: whereDtl,
      whereClauseLaborDtlAttch: '',
      whereClauseLaborDtlComment: '',
      whereClauseLaborEquip: '',
      whereClauseLaborPart: '',
      whereClauseLbrScrapSerialNumbers: '',
      whereClauseLaborDtlGroup: '',
      whereClauseSelectedSerialNumbers: '',
      whereClauseSNFormat: '',
      whereClauseTimeWeeklyView: '',
      whereClauseTimeWorkHours: '',
      pageSize,
      absolutePage: currentPage
    };
    return this.makeRequest('GetRows', params).then(results => ({
      dataset: results.returnObj,
      morePage: results.parameters.morePage
    }));
  }

  /**
   * Create a new LaborDtl entry.
   * The LaborHed entry is created also if a match is not found for the given parameters
   * (date, employeenum, and custom keys in customLaborHedData).
   * Return dataset with LaborHed and LaborDtl (both arrays with 1 entry).
   * If the Hours passed is not specified, the detail record will not be created and we will only create the header
   * (in that case if there is a matching header we'll just return it) - however Hours may be passed as 0 to create
   * a detail record with 0 hours
   */
  async addLaborEntry(entry, customLaborHedData, customLaborDtlData) {
    // console.log(entry)
    new SimpleSchema({
      EmployeeNum: String,
      PayrollDate: /\d{4}-\d{2}-\d{2}/,
      Hours: {type: Number, optional: true},
      OprSeq: {type: Number, optional: true},
      ProjectID: {type: String, optional: true},
      JobNum: {type: String, optional: true},
      IndirectCode: {type: String, optional: true},
      Note: {type: String, optional: true}
    }).validate(
      entry /* {ignore: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA} */
    );

    let dataset = await this._findOrCreateLaborHed(entry, customLaborHedData);
    if (_findDetailEntry(dataset, entry)) {
      throw new Error('Duplicate entry - please refresh and try again');
    }

    // 3 - create labor dtl
    if (entry.Hours !== undefined) {
      dataset = await this._createLaborDtl(entry, dataset, customLaborDtlData);
    }
    return dataset;
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
    new SimpleSchema({
      LaborHedSeq: Number,
      // pass a 0, to skip updating the LaborDtl object
      LaborDtlSeq: Number,
      Hours: {type: Number, optional: true}
    }).validate(entry);
    let ds = (await this.makeRequest('GetByID', {
      laborHedSeq: entry.LaborHedSeq
    })).returnObj;
    let recalledEntries = null;
    let hed = ds.LaborHed[0];
    let oldHedSeq = 0;
    let dtl = ds.LaborDtl.filter(v => v.LaborDtlSeq === entry.LaborDtlSeq)[0];
    if (!hed)
      throw new Error(`LaborHed id ${entry.LaborHedSeq} cannot be found`);
    if (!dtl && entry.LaborDtlSeq)
      throw new Error(
        `LaborDtl id ${entry.LaborHedSeq} / ${
          entry.LaborDtlSeq
        } cannot be found`
      );
    // updates that are applied to LaborHed
    if (customLaborHedData && !_compareHedData(hed, customLaborHedData)) {
      if (dtl) {
        // move entry to new labor head!
        // we need to:
        // - recall the entries, otherwise we can't touch the tasks
        recalledEntries = await this._recallEntriesDataset({LaborDtl: [dtl]});
        if (recalledEntries && recalledEntries.LaborDtl.length) {
          // requery, so we get the new sys rev id
          dtl = recalledEntries.LaborDtl[0];
        }
        // - create new header, or locate existing one
        ds = await this._findOrCreateLaborHed(
          {
            PayrollDate: hed.PayrollDate,
            EmployeeNum: hed.EmployeeNum
          },
          customLaborHedData
        );
        oldHedSeq = dtl.LaborHedSeq;
        // delete old entry
        ds.LaborDtl.push({
          ...dtl,
          RowMod: 'D'
        });
        Object.assign(dtl, {
          LaborHedSeq: ds.LaborHed[0].LaborHedSeq,
          RowMod: 'A',
          LaborDtlSeq: 0
        });
        ds.LaborDtl.push(dtl);
      } else {
        // just update the existing header data, if we are not dealing with detail entries
        Object.assign(hed, {
          ...customLaborHedData,
          RowMod: 'U'
        });
      }
    }
    // updates that are applied to LaborDtl
    if (dtl) {
      if (entry.Hours !== undefined) {
        Object.assign(dtl, {
          LaborHrs: entry.Hours,
          BurdenHrs: entry.IndirectCode ? 0 : entry.Hours
        });
      }
      if (!dtl.RowMod) dtl.RowMod = 'U';
      _recalculateLaborHedTotalsInDataset(ds);
      // we need the other Dtl records to recalculate the total, but we don't have to actually send them
      // (and we don't need to return them to the caller, either)
      // if we are updating a Dtl, then we'll only have 1 record in there
      // if we are adding / deleting, we'll have 2 records, but we'll be returning only one
      ds.LaborDtl = ds.LaborDtl.filter(x => !!x.RowMod);
    } else {
      // no point in sending detail records
      ds.LaborDtl = [];
    }
    // I think it will calculate those for me?
    // ClockinTime: 8,
    // ClockoutTime: 8 + entry.Hours,
    const resultDs = (await this.makeRequest('Update', {ds})).parameters.ds;
    if (oldHedSeq) {
      await this._recalculateLaborHedTotals(oldHedSeq, true);
    }
    if (recalledEntries) {
      // resubmit
      resultDs.LaborDtl = (await this._submitEntriesDataset({
        LaborDtl: resultDs.LaborDtl
      })).LaborDtl;
    }
    return resultDs;
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
    }).validate(entry, {ignore: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA});
    const {LaborHedSeq} = entry;
    // we still get all the details for that header, so that we can recalc the totals
    const {dataset} = await this._getRows(`LaborHedSeq='${LaborHedSeq}'`);
    if (entry.LaborDtlSeq <= 0) {
      // delete all the labor detail, and the header, since we are deleting by header alone
      dataset.LaborDtl.forEach(dtl => {
        dtl.RowMod = 'D';
      });
      if (dataset.LaborHed.length) {
        dataset.LaborHed[0].RowMod = 'D';
      }
    } else {
      const dtl = dataset.LaborDtl.filter(
        d => d.LaborDtlSeq === entry.LaborDtlSeq
      )[0];
      if (dtl) {
        dtl.RowMod = 'D';
        if (dataset.LaborDtl.length === 1) {
          // deleting the only detail item
          if (dataset.LaborHed.length) {
            dataset.LaborHed[0].RowMod = 'D';
          }
        } else {
          _recalculateLaborHedTotalsInDataset(dataset);
        }
      }
    }
    // the hours on the LaborHed record will be updated automatically, if not deleted
    return this.makeRequest('Update', {ds: dataset});
  }

  /**
   * Delete all entries within a row
   */
  async deleteRow(rowCriteria) {
    const [where, whereDtl] = _buildWhereRow(rowCriteria);
    // console.log('deleteWhere', { where, whereDtl })
    const {dataset} = await this._getRows(
      where,
      100,
      0,
      whereDtl.join(' and ')
    );
    if (dataset.LaborDtl.length) {
      dataset.LaborDtl.forEach(ld => {
        ld.RowMod = 'D';
      });
      // keep these so we delete the related headers, if they are now empty
      // ideally we'd delete them at the same time, but this causes a transaction error
      const hedSeqs = Object.keys(
        R.indexBy(R.prop('LaborHedSeq'), dataset.LaborDtl)
      );
      await this.makeRequest('Update', {ds: dataset});
      await this._recalculateLaborHedTotals(hedSeqs, true);
      return true;
    }
    return false;
  }

  /**
   * Update all entries within a row (this should only be used for detail changes, because we won't move entries to a different header)
   */
  async updateRow(rowCriteria, newDtlValues) {
    const [where, whereDtl] = _buildWhereRow(rowCriteria);
    // console.log('deleteWhere', { where, whereDtl })
    let {dataset} = await this._getRows(where, 100, 0, whereDtl.join(' and '));

    if (dataset.LaborDtl.length) {
      Object.keys(newDtlValues).forEach(
        key => R.isNil(newDtlValues[key]) && delete newDtlValues[key]
      );

      const changes = [];

      const recalledEntries = await this._recallEntriesDataset(dataset);
      if (recalledEntries) {
        // need to requery to get updated SysRevId
        dataset = (await this._getRows(where, 100, 0, whereDtl.join(' and ')))
          .dataset;
      }

      const isIndirectCodeChanged = dataset.LaborDtl.some(
        ld =>
          newDtlValues.IndirectCode &&
          ld.IndirectCode !== newDtlValues.IndirectCode
      );
      const isProjectIDChanged = dataset.LaborDtl.some(
        ld => newDtlValues.ProjectID && ld.ProjectID !== newDtlValues.ProjectID
      );
      const isLaborTypeChanged = dataset.LaborDtl.some(
        ld =>
          (newDtlValues.IndirectCode && ld.ProjectID) ||
          (newDtlValues.ProjectID && ld.IndirectCode)
      );
      const isJobNumChanged =
        isProjectIDChanged ||
        dataset.LaborDtl.some(
          ld => newDtlValues.JobNum && ld.JobNum !== newDtlValues.JobNum
        );
      const isOprSeqChanged =
        isJobNumChanged ||
        dataset.LaborDtl.some(
          ld => newDtlValues.OprSeq && ld.OprSeq !== newDtlValues.OprSeq
        );

      dataset.LaborDtl.forEach(ld => {
        Object.assign(ld, {
          ...newDtlValues,
          RowMod: 'U'
        });
      });

      if (isLaborTypeChanged) {
        dataset = (await this.makeRequest('DefaultLaborType', {
          ds: dataset,
          ipLaborType: isIndirectCodeChanged ? 'I' : 'P'
        })).parameters.ds;

        changes.push(...LABOR_TYPE_CHANGE_PROPERTIES);
      }
      if (isIndirectCodeChanged) {
        dataset = (await this.makeRequest('DefaultIndirect', {
          ds: dataset,
          indirectCode: newDtlValues.IndirectCode
        })).parameters.ds;

        // This hack is in place because calling DefaultIndirect clears out the Job
        // and Operation, but not the ProjectID.
        dataset.LaborDtl.forEach(ld => Object.assign(ld, {ProjectID: ''}));
      }
      if (isProjectIDChanged) {
        dataset = (await this.makeRequest('DefaultProjectID', {
          ds: dataset,
          ipProjectID: newDtlValues.ProjectID
        })).parameters.ds;

        changes.push(...PROJECT_ID_CHANGE_PROPERTIES);
      }
      if (isJobNumChanged) {
        dataset = (await this.makeRequest('DefaultJobNum', {
          ds: dataset,
          jobNum: newDtlValues.JobNum
        })).parameters.ds;

        changes.push(...JOB_NUM_CHANGE_PROPERTIES);
      }
      if (isOprSeqChanged) {
        dataset = (await this.makeRequest('DefaultOprSeq', {
          ds: dataset,
          oprSeq: newDtlValues.OprSeq
        })).parameters.ds;

        changes.push(...OPR_SEQ_CHANGE_PROPERTIES);
      }

      // Hack because Epicor does not update all the rows from the dataset
      // (eg when changing from/to indirect)
      if (changes.length) {
        const changed = R.pick(changes, dataset.LaborDtl[0]);
        dataset.LaborDtl.slice(1).forEach(ld => Object.assign(ld, changed));
      }

      dataset = (await this.makeRequest('Update', {
        ds: dataset
      })).parameters.ds;

      if (recalledEntries) {
        const idsToSubmit = R.fromPairs(
          recalledEntries.LaborDtl.map(d => [d.LaborDtlSeq, true])
        );
        await this._submitEntriesDataset({
          LaborDtl: dataset.LaborDtl.filter(d => !!idsToSubmit[d.LaborDtlSeq])
        });
      }

      return dataset;
    }

    return false;
  }

  async submitTimesheet(whereObject, datesToSubmit) {
    new SimpleSchema({
      FromDate: /\d{4}-\d{2}-\d{2}/,
      ToDate: /\d{4}-\d{2}-\d{2}/,
      EmployeeNum: String,
      // can be specified to submit a single entry
      LaborDtlSeq: {type: Number, optional: true},
      LaborHedSeq: {type: Number, optional: true}
    }).validate(whereObject);

    const [where, whereDtl] = _buildWhereRow(whereObject);
    let {dataset} = await this._getRows(where, 100, 0, whereDtl.join(' and '));

    _validateForSubmission(dataset);

    dataset.LaborDtl = dataset.LaborDtl.filter(ld => {
      const payrollDate = moment(ld.PayrollDate).format('YYYY-MM-DD');
      return datesToSubmit.includes(payrollDate);
    });
    if (dataset.LaborDtl.length) {
      return this._submitEntriesDataset(dataset);
    }
    return false;
  }

  /**
   * Mark entries as recalled.  Only entries that have been submitted, and not posted, are recalled.
   *
   * @param entries Array of object with properties: LaborHedSeq, LaborDtlSeq
   */
  async recallTimesheetEntries(entries) {
    const where = `LaborHedSeq in (${R.uniq(
      R.map(R.prop('LaborHedSeq'), entries)
    ).join(',')})`;
    const whereDtl = `LaborDtlSeq in (${R.map(
      R.prop('LaborDtlSeq'),
      entries
    ).join(',')})`;
    let {dataset} = await this._getRows(where, 100, 0, whereDtl);
    if (dataset.LaborDtl.length) {
      return this._recallEntriesDataset(dataset);
    }
    return false;
  }

  async _submitEntriesDataset(dataset) {
    let ds = {
      ...dataset,
      LaborDtl: dataset.LaborDtl.map(ld => ({
        ...ld,
        EnableSubmit: true,
        TimeAutoSubmit: true,
        RowMod: 'U'
      }))
    };
    // console.log(
    //   'Before updates',
    //   require('util').inspect(dataset.LaborDtl, false, null)
    // );
    ds = (await this.makeRequest('Update', {ds})).parameters.ds;
    ds.LaborDtl = dataset.LaborDtl.map(ld => Object.assign(ld, {RowMod: 'U'}));
    ds = (await this.makeRequest('SubmitForApproval', {
      ds,
      lWeeklyView: false
    })).parameters.ds;
    // console.log(
    //   'After submit',
    //   require('util').inspect(dataset.LaborDtl, false, null)
    // );
    return (await this.makeRequest('Update', {ds})).parameters.ds;
  }

  async _recallEntriesDataset(dataset) {
    let ds = {
      ...dataset,
      LaborDtl: dataset.LaborDtl.filter(
        ld => !ld.NotSubmitted && !ld.PostedToGL
      ).map(ld => Object.assign(ld, {RowMod: 'U'}))
    };
    if (ds.LaborDtl.length === 0) return false;
    ds = (await this.makeRequest('RecallFromApproval', {
      ds,
      lWeeklyView: false
    })).parameters.ds;
    // console.log('After submit', require('util').inspect(dataset.LaborDtl, false, null))
    return (await this.makeRequest('Update', {ds})).parameters.ds;
  }

  async _findOrCreateLaborHed(entry, customLaborHedData) {
    // 1 - find labor hed
    let where = `EmployeeNum='${entry.EmployeeNum}'
    and PayrollDate >= '${entry.PayrollDate}'
    and PayrollDate < '${moment(entry.PayrollDate)
      .add(1, 'days')
      .format('YYYY-MM-DD')}'`;
    if (customLaborHedData) {
      where += Object.keys(customLaborHedData)
        .map(k => ` and ${k} = '${customLaborHedData[k].replace(/'/g, "''")}'`)
        .join('');
    }
    let {dataset} = await this._getRows(where, 50, 0);
    // do we need other crits?

    // 2 - if no labor hed, create a new one
    if (dataset.LaborHed.length === 0) {
      dataset = await this._createLaborHed(entry, customLaborHedData);
    }
    return dataset;
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
    });
    // TODO add stuff like ClockInDate, etc
    Object.assign(parameters.ds.LaborHed[0], {
      PayHours: entry.Hours || 0,
      // we don't need that, the system will calculate for us :)
      // ClockInTime: 8,
      // ClockOutTime: 8 + entry.Hours,
      // ActualClockInTime: 8,
      // ActualClockOutTime: 8 + entry.Hours,
      RowMod: 'A'
    });
    if (customLaborHedData)
      Object.assign(parameters.ds.LaborHed[0], customLaborHedData);
    return (await this.makeRequest('Update', parameters)).parameters.ds;
  }

  async _createLaborDtl(entry, sourceDs, customLaborDtlData) {
    let workingDS = (await this.makeRequest('GetNewLaborDtl', {
      ds: {},
      laborHedSeq: sourceDs.LaborHed[0].LaborHedSeq
    })).parameters.ds;
    if (entry.ProjectID) {
      workingDS = (await this.makeRequest('DefaultProjectID', {
        ds: workingDS,
        ipProjectID: entry.ProjectID
      })).parameters.ds;
    }
    if (entry.JobNum && entry.OprSeq !== undefined) {
      workingDS = (await this.makeRequest('DefaultJobNum', {
        ds: workingDS,
        jobNum: entry.JobNum
      })).parameters.ds;
      workingDS = (await this.makeRequest('DefaultAssemblySeq', {
        ds: workingDS,
        assemblySeq: 0
      })).parameters.ds;
      workingDS = (await this.makeRequest('DefaultOprSeq', {
        ds: workingDS,
        oprSeq: entry.OprSeq
      })).parameters.ds;
    } else if (entry.IndirectCode) {
      workingDS = (await this.makeRequest('ChangeLaborType', {ds: workingDS}))
        .parameters.ds;
      workingDS = (await this.makeRequest('DefaultLaborType', {
        ds: workingDS,
        ipLaborType: 'I'
      })).parameters.ds;
      workingDS = (await this.makeRequest('ChangeIndirectCode', {
        ds: workingDS
      })).parameters.ds;
      workingDS = (await this.makeRequest('DefaultIndirect', {
        ds: workingDS,
        indirectCode: entry.IndirectCode
      })).parameters.ds;
    } else {
      // throw new Error('IndirectCode or JobNum/OprSeq must be provided')
    }
    Object.assign(workingDS.LaborDtl[0], {
      LaborHrs: entry.Hours,
      BurdenHrs: entry.IndirectCode ? 0 : entry.Hours,
      // Clockin / Clockout time seem to be automatically determined by the system.
      // When there are more than 1 entries in a day it does not work well... but it does not seem to cause any issue (in the UI at least)
      // ClockinTime: 8,
      // ClockoutTime: 8 + entry.Hours,
      // EnableSubmit: false,
      // TimeAutoSubmit: false,
      RowMod: 'A'
    });
    if (customLaborDtlData)
      Object.assign(workingDS.LaborDtl[0], customLaborDtlData);
    sourceDs.LaborDtl.push(workingDS.LaborDtl[0]);
    _recalculateLaborHedTotalsInDataset(sourceDs);
    // avoid sending the other Dtl records
    sourceDs.LaborDtl = workingDS.LaborDtl;
    return (await this.makeRequest('Update', {ds: sourceDs})).parameters.ds;
  }

  /**
   * Recalculate totals for matching laborhed records.
   * We'll query Epicor for the latest version of the data, and then update epicor if the data has changed.
   * (may need to optimize that later, but while we are not sure exactly what needs to be recalculated that
   * will let us test)
   */
  async _recalculateLaborHedTotals(laborHedSeq, deleteEmptyHed = false) {
    const where = Array.isArray(laborHedSeq)
      ? `LaborHedSeq in (${laborHedSeq.join(',')})`
      : `LaborHedSeq = ${laborHedSeq}`;
    const {dataset} = await this._getRows(where);
    if (_recalculateLaborHedTotalsInDataset(dataset, deleteEmptyHed)) {
      return (await this.makeRequest('Update', {ds: dataset})).parameters.ds;
    }
  }
}

// Utility functions

// Build a [where, whereDtl] condition based on some pre-defined fields
function _buildWhereRow(rowCriteria) {
  new SimpleSchema({
    FromDate: /\d{4}-\d{2}-\d{2}/,
    ToDate: /\d{4}-\d{2}-\d{2}/,
    EmployeeNum: String,
    JobNum: {type: String, optional: true},
    OprSeq: {type: Number, optional: true},
    IndirectCode: {type: String, optional: true},
    LaborDtlSeq: {type: Number, optional: true},
    LaborHedSeq: {type: Number, optional: true}
  }).validate(rowCriteria);
  const {
    FromDate,
    ToDate,
    EmployeeNum,
    JobNum,
    OprSeq,
    LaborDtlSeq,
    LaborHedSeq,
    IndirectCode
  } = rowCriteria;
  const whereDtl = [];
  if (JobNum) whereDtl.push(`JobNum = '${JobNum}'`);
  if (OprSeq) whereDtl.push(`OprSeq = '${OprSeq}'`);
  if (IndirectCode) whereDtl.push(`IndirectCode = '${IndirectCode}'`);
  if (LaborDtlSeq) whereDtl.push(`LaborDtlSeq = '${LaborDtlSeq}'`);
  let where = `EmployeeNum = '${EmployeeNum}'
    and PayrollDate < '${moment(ToDate)
      .add(1, 'day')
      .format('YYYY-MM-DD')}'
    and PayrollDate >= '${moment(FromDate).format('YYYY-MM-DD')}'`;
  if (LaborHedSeq) {
    where = 'LaborHedSeq = ' + LaborHedSeq;
  }
  return [where, whereDtl];
}

function _compareHedData(header, newHeaderData) {
  for (let k in newHeaderData) {
    if (header[k] !== newHeaderData[k]) return false;
  }
  return true;
}

function _findDetailEntry(dataset, entry) {
  const jobNum = entry.JobNum || '',
    oprSeq = entry.OprSeq || '',
    indirectCode = entry.IndirectCode || '';
  return R.find(
    j =>
      j.JobNum === jobNum &&
      j.OprSeq === oprSeq &&
      j.IndirectCode === indirectCode,
    dataset.LaborDtl
  );
}

/**
 * Recalculate totals for each LaborHed record in the dataset.
 * Return true if there was a change
 */
function _recalculateLaborHedTotalsInDataset(dataset, deleteEmptyHed = false) {
  let wasChanged = false;
  for (let hed of dataset.LaborHed) {
    let payHours = 0,
      detlCount = 0;
    for (let dtl of dataset.LaborDtl) {
      if (dtl.LaborHedSeq === hed.LaborHedSeq && dtl.RowMod !== 'D') {
        payHours += dtl.LaborHrs;
        detlCount++;
      }
    }
    // not sure if we should remove them if payHours reaches 0?
    if (hed.PayHours !== payHours) {
      hed.PayHours = payHours;
      hed.RowMod = 'U';
      wasChanged = true;
    }
    if (detlCount === 0 && deleteEmptyHed) {
      hed.RowMod = 'D';
      wasChanged = true;
    }
  }
  return wasChanged;
}

function _validateForSubmission(dataset) {
  const timesPerDay = {};
  dataset.LaborDtl.forEach(ld => {
    timesPerDay[ld.PayrollDate] =
      (timesPerDay[ld.PayrollDate] || 0) + ld.LaborHrs;
  });
  for (let k in timesPerDay) {
    if (timesPerDay[k] > 24) {
      throw new Error('You may only clock 24 hours per day');
    }
  }
}

module.exports = Labor;
