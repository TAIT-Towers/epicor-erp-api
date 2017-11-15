const sinon = require('sinon'),
  chai = require('chai'),
  sinonChai = require('sinon-chai'),
  dotenv = require('dotenv')

chai.use(sinonChai)
chai.should()
global.should = chai.should
global.expect = chai.expect
global.sinon = sinon
dotenv.configure()
