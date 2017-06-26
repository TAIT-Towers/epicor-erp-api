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

    it('calls GetCustomerTerritory and Update', (done) => {
      const r = sinon.stub()
        .onFirstCall().returns(Promise.resolve({
          parameters: {
            ds: {
              Customer: [{
              }]
            }
          }
        }))
        .onSecondCall().returns(Promise.resolve({
          parameters: {
            ds: {
              Customer: [{
                CustNum: 123
              }]
            }
          }
        }))
      connection.makeRequest = r
      customerSvc.create({}).then(custNum => {
        expect(custNum).to.equal(123)
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'GetCustomerTerritory', sinon.match.object)
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'Update', sinon.match.object)
        done()
      })
    })
  })

  describe('update', () => {
    it('calls Get and Update, passing props retrieved from Get, without passing SysRevID', () => {
      const r = sinon.stub()
        .returns(Promise.resolve())
      connection.makeRequest = r
      customerSvc.get = () => Promise.resolve({
        Name: 'Test', SysRevID: 55
      })
      return customerSvc.update({Something: '123', SysRevID: 123}).then(() => {
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'Update', {
          Name: 'Test', Something: '123', RowMod: 'U'
        })
      })
    })

    it('processes update if SysRevID is equal', () => {
      const r = sinon.stub()
        .returns(Promise.resolve())
      connection.makeRequest = r
      customerSvc.get = () => Promise.resolve({
        Name: 'Test', SysRevID: 123
      })
      return customerSvc.update({Something: '123', SysRevID: 123}, {checkRevId: true}).then(() => {
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'Update', {
          Name: 'Test', Something: '123', RowMod: 'U'
        })
      })
    })

    it('throws error if SysRevID is more recent', () => {
      const r = sinon.stub()
        .returns(Promise.resolve())
      connection.makeRequest = r
      customerSvc.get = () => Promise.resolve({
        Name: 'Test', SysRevID: 123
      })
      return customerSvc.update({Something: '123', SysRevID: 55}, {checkRevId: true})
        .then(() => Promise.reject(new Error('Should not process update')), () => null)
    })
  })
})
