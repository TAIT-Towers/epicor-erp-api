const Connection = require('../lib/connection.js'),
  Customer = require('../lib/customer.js');

describe('Customer Service', () => {
  let connection, customerSvc;

  beforeEach(() => {
    connection = new Connection({
      serverUrl: 'https://nowhere.com'
    });
    customerSvc = new Customer(connection);
  });

  describe('create', () => {
    it('returns a promise with error from makeRequest', done => {
      const myError = new Error();
      connection.makeRequest = () => Promise.reject(myError);
      customerSvc.create({}).then(null, err => {
        expect(err).to.equal(myError);
        done();
      });
    });

    it('calls GetCustomerTerritory and Update', () => {
      const r = sinon
        .stub()
        .onFirstCall()
        .returns(
          Promise.resolve({
            parameters: {
              ds: {
                Customer: [
                  {
                    Territory: 'DEF'
                  }
                ]
              }
            }
          })
        )
        .onSecondCall()
        .returns(
          Promise.resolve({
            parameters: {
              ds: {
                Customer: [
                  {
                    SomethingElse: 'xxx'
                  }
                ]
              }
            }
          })
        )
        .onThirdCall()
        .returns(
          Promise.resolve({
            parameters: {
              ds: {
                Customer: [
                  {
                    CustNum: 123
                  }
                ]
              }
            }
          })
        );
      connection.makeRequest = r;
      return customerSvc.create({}).then(({CustNum}) => {
        expect(CustNum).to.equal(123);
        expect(r).to.have.been.calledWith(
          'Erp.Bo.CustomerSvc',
          'GetCustomerTerritory',
          sinon.match.object
        );
        expect(r).to.have.been.calledWith(
          'Erp.Bo.CustomerSvc',
          'GetNewCustomer',
          sinon.match.object
        );
        expect(r).to.have.been.calledWith(
          'Erp.Bo.CustomerSvc',
          'Update',
          sinon.match({
            ds: {
              Customer: [sinon.match({Territory: 'DEF', SomethingElse: 'xxx'})]
            }
          })
        );
      });
    });
  });

  describe('update', () => {
    it('calls Update, passing SysRevID', () => {
      const r = sinon.stub().returns(
        Promise.resolve({
          parameters: {
            ds: {
              Customer: [{Something: '123', SysRevID: 555}]
            }
          }
        })
      );
      connection.makeRequest = r;
      return customerSvc
        .update({Something: '123', SysRevID: 123})
        .then(result => {
          expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'Update', {
            ds: {
              Customer: [
                {
                  Something: '123',
                  RowMod: 'U',
                  SysRevID: 123
                }
              ]
            }
          });
          expect(result).to.eql({Something: '123', SysRevID: 555});
        });
    });
  });

  describe('get', () => {
    it('passes custNum and return resulting customer', () => {
      const r = sinon.stub().returns(
        Promise.resolve({
          returnObj: {
            Customer: [{Something: '123', SysRevID: 555}]
          }
        })
      );
      connection.makeRequest = r;
      return customerSvc.get({CustNum: 555}).then(result => {
        expect(r).to.have.been.calledWith('Erp.Bo.CustomerSvc', 'GetByID', {
          custNum: 555
        });
        expect(result).to.eql({Something: '123', SysRevID: 555});
      });
    });

    it('returns null when not found', () => {
      const r = sinon.stub().returns(
        Promise.reject({
          statusCode: 404
        })
      );
      connection.makeRequest = r;
      return customerSvc.get(555).then(result => {
        expect(result).to.equal(null);
      });
    });

    it('passer errors for other errors', () => {
      const r = sinon.stub().returns(
        Promise.reject({
          statusCode: 500
        })
      );
      connection.makeRequest = r;
      return customerSvc.get(555).then(
        () => expect.fail('should not succeed'),
        err => {
          expect(err).to.eql({statusCode: 500});
        }
      );
    });
  });

  describe('GetRevId', () => {
    it('returns SysRevID field', () => {
      const r = customerSvc.getRevId({SysRevID: 555});
      expect(r).to.equal(555);
    });
  });

  describe('find', () => {
    it('calls GetRows', done => {
      const r = sinon.stub().returns(new Promise(function() {}));
      customerSvc.makeRequest = r;
      const result = customerSvc.find('testing');
      expect(result).to.have.property('on');
      result.on('data', () => {
        throw new Error('there should be no data');
      });
      setImmediate(() => {
        expect(r).to.have.been.calledWith(
          'GetRows',
          sinon.match({
            whereClauseCustomer: 'testing',
            pageSize: 25,
            absolutePage: 0
          })
        );
        done();
      });
    });
  });
});
