const Connection = require('../lib/connection.js'),
  Labor = require('../lib/labor.js')

describe('Labor Service', () => {
  let connection, laborSvc

  beforeEach(() => {
    connection = new Connection({
      serverUrl: 'https://nowhere.com'
    })
    laborSvc = new Labor(connection)
  })

  describe('find', () => {
    it('calls GetRows', (done) => {
      const r = sinon.stub()
        .returns(new Promise(function() {}))
      laborSvc.makeRequest = r
      const result = laborSvc.find('testing')
      expect(result).to.have.property('on')
      result.on('data', () => {
        throw new Error('there should be no data')
      })
      setImmediate(() => {
        expect(r).to.have.been.calledWith('GetRows', sinon.match({whereClauseLaborHed: 'testing', pageSize: 25, absolutePage: 0}))
        done()
      })
    })
  })

  describe('updateLaborEntry', () => {
    it('calls GetByID and recalculate the totals', () => {

    })

    it('updates custom laborhed data by creating new record', () => {

    })
  })
})
