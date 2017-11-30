const rp = require('request-promise-native')
const R = require('ramda')

class Connection {
  constructor({serverUrl, username, password, company, strictSSL}) {
    this.company = company

    // Perform a request using a custom service method
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

    // Perform a GET request to an OData service method
    this.odata = function(service, path, parameters = {}) {
      const qs = R.pickBy((val) => !!val, parameters)
      return rp(`${serverUrl}/api/v1/${service}/${path}`, {
        qs,
        method: 'GET',
        json: true,
        auth: {
          user: username,
          pass: password
        },
        strictSSL: strictSSL
      }).then(({value}) => value)
    }
  }
}

module.exports = Connection
