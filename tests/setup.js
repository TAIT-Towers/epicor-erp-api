const sinon = require('sinon'),
  chai = require('chai'),
  sinonChai = require('sinon-chai'),
  chaiAsPromised = require('chai-as-promised'),
  dotenv = require('dotenv');

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();
global.should = chai.should;
global.expect = chai.expect;
global.sinon = sinon;
dotenv.config();
