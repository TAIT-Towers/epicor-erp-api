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
})
