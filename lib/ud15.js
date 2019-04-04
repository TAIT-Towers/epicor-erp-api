const simpleSchema = require('simpl-schema').default;

const ServiceBase = require('./serviceBase');

const SERVICE = 'ICE.BO.UD15Svc';

class UD15 extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'UD15', 'Key1');
  }

  create(record) {
    return this.makeRequest('GetaNew' + this.datasetName, {
      ds: {
        [this.datasetName]: []
      }
    })
      .then(this._getFromResponse)
      .then(defaults =>
        this.makeRequest(
          'Update',
          {
            ds: {
              [this.datasetName]: [
                {
                  ...defaults,
                  ...record,
                  RowMod: 'A'
                }
              ]
            }
          },
          // include the company if provided on the record
          record.Company || null
        )
      )
      .then(this._getFromResponse);
  }

  /**
   * Update UD15
   * @param record Dataset - Minimum Table required is UD15
   */
  async update(record) {
    return (await this.makeRequest('Update', {
      ds: {
        ...record
      }
    })).parameters.ds;
  }
}

module.exports = UD15;
