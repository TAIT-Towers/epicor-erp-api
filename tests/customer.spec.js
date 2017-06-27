const Connection = require('../lib/connection.js'),
  Customer = require('../lib/customer.js')

describe('Customer Service', () => {
  let connection, customerSvc

  beforeEach(() => {
    connection = new Connection({
      serverUrl: 'https://nowhere.com'
    })
    customerSvc = new Customer(connection)
  })

  describe('create', () => {
    it('returns a promise with error from makeRequest', (done) => {
      const myError = new Error()
      connection.makeRequest = () => Promise.reject(myError)
      customerSvc.create({}).then(null, (err) => {
        expect(err).to.equal(myError)
        done()
      })
    })

    it('calls GetCustomerTerritory and Update', () => {
      const r = sinon.stub()
        .onFirstCall().returns(Promise.resolve({
          parameters: {
            ds: {
              Customer: [{
                Territory: 'DEF'
              }]
            }
          }
        }))
        .onSecondCall().returns(Promise.resolve({
          parameters: {
            ds: {
              Customer: [{
                SomethingElse: 'xxx'
              }]
            }
          }
        }))
        .onThirdCall().returns(Promise.resolve({
          parameters: {
            ds: {
              Customer: [{
                CustNum: 123
              }]
            }
          }
        }))
      connection.makeRequest = r
      return customerSvc.create({}).then(({CustNum}) => {
        expect(CustNum).to.equal(123)
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'GetCustomerTerritory', sinon.match.object)
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'GetNewCustomer', sinon.match.object)
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'Update',
          sinon.match({ds: {Customer: [sinon.match({Territory: 'DEF', SomethingElse: 'xxx'})]}}))
      })
    })
  })

  describe('update', () => {
    it('calls Update, without passing SysRevID', () => {
      const r = sinon.stub()
        .returns(Promise.resolve({
          parameters: {
            ds: {
              Customer: [{Something: '123', SysRevID: 555}]
            }
          }
        }))
      connection.makeRequest = r
      return customerSvc.update({Something: '123', SysRevID: 123}).then(result => {
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'Update', {ds: {Customer: [{
          Something: '123', RowMod: 'U'
        }]}})
        expect(result).to.eql({Something: '123', SysRevID: 555})
      })
    })
  })
})
