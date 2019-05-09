const SalesOrder = require('../lib/salesOrder.js');

describe('SalesOrder Service', () => {
  let salesOrderSvc;

  beforeEach(() => {
    salesOrderSvc = new SalesOrder();
  });

  it('should have service methods', () => {
    expect(salesOrderSvc).to.have.property('create');
    expect(salesOrderSvc).to.have.property('changeMake');
    expect(salesOrderSvc).to.have.property('update');
  });
});
