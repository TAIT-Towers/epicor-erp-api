const Connection = require('../lib/connection.js'),
  Currency = require('../lib/currency.js');

describe('Currency Service', () => {
  let connection, currencySvc;

  beforeEach(() => {
    connection = new Connection({
      serverUrl: 'https://nowhere.com'
    });
    currencySvc = new Currency(connection);
  });

  it('passes blank when running findUpdated', () => {
    currencySvc.find = sinon.spy();
    currencySvc.findUpdated(123);
    expect(currencySvc.find).to.have.been.calledWith('');
  });
});
