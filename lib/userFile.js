const ServiceBase = require('./serviceBase')

const SERVICE = 'Ice.Bo.UserFileSvc'

class Employee extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'UserFile', 'UserID')
  }

  getCurrentUser() {
    return this.makeRequest('GetUserFile', {})
      .then(r => r.returnObj)
  }
}

module.exports = Employee
