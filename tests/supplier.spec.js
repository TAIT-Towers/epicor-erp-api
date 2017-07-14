const Supplier = require('../lib/supplier.js')

describe('Supplier Service', () => {
  let supplierSvc

  beforeEach(() => {
    supplierSvc = new Supplier({})
  })

  it('should have service methods', () => {
    expect(supplierSvc).to.have.property('find')
    expect(supplierSvc).to.have.property('get')
    expect(supplierSvc).to.have.property('create')
    expect(supplierSvc).to.have.property('update')
  })

  it('returns supplier data', (done) => {
    supplierSvc.makeRequest = sinon.stub().returns(Promise.resolve({
      returnObj: {
        Vendor: [
          {
            Company: 150,
            VendorID: 123
          }
        ]
      },
      parameters: {}
    }))
    supplierSvc.findUpdated(123).on('data', rec => {
      expect(rec).to.eql({
        Company: 150, VendorID: 123
      })
      done()
    })
  })
})
