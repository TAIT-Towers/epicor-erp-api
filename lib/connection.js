const rp = require('request-promise-native')
const { Readable } = require('stream')

class Connection {
  constructor({serverUrl, username, password, company, strictSSL}) {
    this.company = company

    this.makeRequest = function(service, method, parameters = {}) {
      // TODO some nicer error handling?
      return rp(`${serverUrl}/api/v1/${service}/${method}`, {
        body: parameters,
        method: 'POST',
        json: true,
        auth: {
          user: username,
          pass: password
        },
        strictSSL: strictSSL,
        // does not work?
        // agentOptions: {
        //   ca: fs.readFileSync('./samples/cacert.pem')
        // }
      })
    }
  }

  /**
   * @param service String - name of the service (same as in makeRequest)
   * @param where String - optional where clause, which can include a sort parameter: "SysRevID > 555 BY SysRevID
   * @param pageSize int
   * @param returnObjName String - the name of the property that holds the results in the resulting returnObj object
   */
  find(service, returnObjName, where = '', pageSize = 25) {
    return new FindStream(this, service, returnObjName, where, pageSize)
  }
}

class FindStream extends Readable {
  constructor(connection, service, returnObjName, where, pageSize) {
    super({highWaterMark: pageSize, objectMode: true})
    this.connection = connection
    this.service = service
    this.returnObjName = returnObjName
    this.pageSize = pageSize
    this.where = where
    this.page = 0
    this.isReading = false
  }

  _read(n) {
    if(!this.isReading) {
      this.isReading = true
      this.startReading()
    }
  }

  startReading() {
    this.connection.makeRequest(this.service, 'GetList', {
      whereClause: this.where, pageSize: this.pageSize, absolutePage: this.page
    }).then(results => {
      if(!results.parameters || !results.returnObj || !results.returnObj[this.returnObjName]) {
        this.emit('error', new Error('Invalid response from request'))
      } else {
        const records = results.returnObj[this.returnObjName]
        records.forEach(record => {
          this.push(record)
        })
        if(!results.parameters.morePage) {
          this.push(null)
        } else {
          setImmediate(() => this.startReading())
        }
      }
    }, err => {
      this.emit('error', err)
    })
  }
}

module.exports = Connection
