const Epicor = require('../index');

describe('index', () => {
  it('instantiates services', () => {
    const connection = new Epicor({});
    expect(connection).to.have.property('Customer');
    expect(connection).to.have.property('SalesTerritory');
    expect(connection).to.have.property('Supplier');
  });
});
