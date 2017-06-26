const rp = require('request-promise-native')

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
}

module.exports = Connection
