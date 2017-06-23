const Epicor = require('../index')
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '/.env')})

module.exports = new Epicor({
  serverUrl: process.env['SERVER_URL'],
  username: process.env['USERNAME'],
  password: process.env['PASSWORD'],
  company: process.env['COMPANY'],
  strictSSL: process.env['SKIP_CERT_VERIFICATION'] !== 'true'
})
