const Connection = require('../lib/connection')
const ServiceBase = require('../lib/serviceBase')

describe('ServiceBase', () => {
  describe('find', () => {
    let connection, service

    beforeEach(() => {
      connection = new Connection({
        serverUrl: 'https://nowhere.com'
      })
      service = new ServiceBase(connection, 'SomeService', 'Property')
    })

    it('returns an object with on property', () => {
      const result = service.find()
      result.should.have.property('on').that.is.a('function')
    })

    it('emits error event when there is an error', (done) => {
      const result = service.find()
      // need a data handler to start the stream flowing
      result.on('data', () => {
        done('there should be no data')
      })
      result.on('error', () => done())
    })

    it('emits error event when makeRequest returns invalid data', (done) => {
      connection.makeRequest = () => Promise.resolve({
        parameters: {},
        returnObj: { someotherproperty: [] }
      })
      const result = service.find()
      result.on('data', () => {
        done('there should be no data')
      })
      result.on('error', () => done())
    })

    it('emits end event if there is no data', (done) => {
      connection.makeRequest = () => Promise.resolve({
        parameters: {},
        returnObj: { PropertyList: [] }
      })
      const result = service.find()
      result.on('data', () => {
        done('there should be no data')
      })
      result.on('end', done)
    })

    it('emits data events for retrieved records', (done) => {
      connection.makeRequest = () => Promise.resolve({
        parameters: {},
        returnObj: { PropertyList: [{
          id: 1
        }] }
      })
      const result = service.find()
      result.on('data', rec => {
        rec.id.should.equal(1)
      })
      result.on('end', done)
    })

    it('processes multiple pages when morePage is true', (done) => {
      const fakeRequest = sinon.stub()
        .onFirstCall().returns(Promise.resolve({
          parameters: { morePage: true },
          returnObj: { PropertyList: [{id: 1}] }
        }))
        .onSecondCall().returns(Promise.resolve({
          parameters: { morePage: false },
          returnObj: { PropertyList: [{id: 2}] }
        }))
      let data = []
      service.makeRequest = fakeRequest
      const result = service.find()
      result.on('data', rec => {
        data.push(rec)
      })
      result.on('end', () => {
        data.should.eql([
          {id: 1},
          {id: 2}
        ])
        expect(fakeRequest).to.have.been.calledWith('GetList', sinon.match({absolutePage: 0}))
        expect(fakeRequest).to.have.been.calledWith('GetList', sinon.match({absolutePage: 1}))
        done()
      })
    })

    it('processes large pages', (done) => {
      const fakeRequest = sinon.stub()
      for(let j = 0; j < 20; j++) {
        const page = []
        for(let i = 0; i < 25; i++) {
          page.push({id: j * 25 + i})
        }
        fakeRequest.onCall(j).returns(Promise.resolve({
          parameters: {morePage: j !== 19},
          returnObj: { PropertyList: page }
        }))
      }
      let data = []
      connection.makeRequest = fakeRequest
      const result = service.find()
      result.on('data', rec => data.push(rec))
      result.on('end', () => {
        data.should.have.length(20 * 25)
        for(let i = 0; i < 20 * 25; i++) {
          data[i].should.eql({id: i})
        }
        done()
      })
    })

    it('calls GetList with where clause', (done) => {
      service.makeRequest = sinon.stub().returns(Promise.resolve({
        parameters: {},
        returnObj: { PropertyList: [] }
      }))
      const result = service.find('MyWhereClause', {pageSize: 30})
      result.on('data', () => {
        done('there should be no data')
      })
      result.on('end', () => {
        expect(service.makeRequest).to.have.been.calledWith('GetList', {
          whereClause: 'MyWhereClause', pageSize: 30, absolutePage: 0
        })
        done()
      })
    })

    it('processes multiple data tables in dataset', (done) => {
      service.makeRequest = sinon.stub().returns(Promise.resolve({
        parameters: {},
        returnObj: {
          PropertyList: [
            { Company: 150, ParentId: '1' },
            { Company: 150, ParentId: '2' },
          ],
          Children: [
            { Company: 150, ChildId: '2', ParentId: '2' }
          ]
        }
      }))
      const records = []
      const result = service.find('MyWhereClause', {pageSize: 30})
      result.on('data', r => records.push(r))
      result.on('end', () => {
        records.should.have.length(2)
        records.should.eql([
          { Company: 150, ParentId: '1' },
          { Company: 150, ParentId: '2', Children: [{
            Company: 150, ChildId: '2', ParentId: '2'
          }]}
        ])
        done()
      })
    })

    it('limits number of retrieved records', (done) => {
      connection.makeRequest = () => Promise.resolve({
        parameters: {morePage: true},
        returnObj: { PropertyList: [{
          id: 1
        }, {
          id: 2
        }] }
      })
      const result = service.find('', {limit: 1})
      result.on('data', rec => {
        rec.id.should.equal(1)
      })
      result.on('end', done)
    })
  })
})
