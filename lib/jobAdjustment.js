const ServiceBase = require('./serviceBase')
const { v4: uuidv4 } = require('uuid')

const SERVICE = 'Erp.BO.JobAdjustmentSvc'

class JobAdjustment extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'JALaborDtl', 'JobNum')
  }

  async makeLaborAdjustment(company, jobNum, assemblySeq, oprSeq, laborQty, employeeNum, opComplete) {
    let ds = (await this.makeRequest('StartAdjustments', {
      ds: {
        Jobs: [
          {
              Company: company,
              JobNum: jobNum,
              SysRowID: uuidv4(),
              RowMod: 'U'
          }
        ]
      }
    })).parameters.ds
    ds.JALaborDtl[0].RowMod = 'U'
    ds.JALaborDtl[0].AssemblySeq = assemblySeq
    ds = (await this.makeRequest('ChangeLaborAssemSeq', {
      laborAssmSeq: assemblySeq,
      ds
    })).parameters.ds
    ds.JALaborDtl[0].OprSeq = Number(oprSeq)
    ds = (await this.makeRequest('ChangeLaborOprSeq', {
      laborDtlOprSeq: Number(oprSeq),
      ds
    })).parameters.ds
    ds.JALaborDtl[0].EmployeeNum = employeeNum
    ds = (await this.makeRequest('ChangeLaborEmployeeNum', {
      laborDtlEmployeeNum: employeeNum,
      ds
    })).parameters.ds
    ds.JALaborDtl[0].LaborQty = laborQty
    ds.JALaborDtl[0].Complete = opComplete
    ds.JALaborDtl[0].OpComplete = opComplete

    await this.makeRequest('CommitLaborAdj', {
      'ds': {
        ...ds
      }
    })
  }
}

module.exports = JobAdjustment