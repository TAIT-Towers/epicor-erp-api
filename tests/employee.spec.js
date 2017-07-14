const Employee = require('../lib/employee.js')

describe('Employee Service', () => {
  let employeeSvc

  beforeEach(() => {
    employeeSvc = new Employee({})
  })

  it('should have service methods', () => {
    expect(employeeSvc).to.have.property('find')
    expect(employeeSvc).to.have.property('get')
    expect(employeeSvc).to.have.property('create')
    expect(employeeSvc).to.have.property('update')
  })

  it('returns employee data', (done) => {
    employeeSvc.makeRequest = sinon.stub().returns(Promise.resolve({
      returnObj: {
        EmpBasic: [
          {
            Company: 150,
            EmpID: 123
          }
        ],
        EmpRole: [
          { EmpID: 123, RoleId: '123' }
        ]
      },
      parameters: {}
    }))
    employeeSvc.findUpdated(123).on('data', rec => {
      expect(employeeSvc.makeRequest).to.have.been.calledWith('GetRows', sinon.match({
        whereClauseEmpBasic: 'SysRevID > 123 BY SysRevID'
      }))
      expect(rec).to.eql({
        Company: 150, EmpID: 123,
        EmpRole: [
          {EmpID: 123, RoleId: '123'}
        ]
      })
      done()
    })
  })
})
