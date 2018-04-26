const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.Bo.LaborSvc';

class Task extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Task', 'TaskID');
  }

  // Update the key1 value for all the tasks that have matching relatedToFile / key2 / old key 1
  async updateKey1(oldKey1, key2, relatedToFile, newKey1) {
    const {dataset} = await this._getRows(
      `Key1='${oldKey1}' and Key2='${key2}' and RelatedToFile='${relatedToFile}'`,
      0,
      0
    );
    for (let t of dataset.TaskList) {
      t.RowMod = 'U';
      t.Key1 = newKey1;
    }
    await this.makeRequest('Update', {ds: dataset});
  }
}

module.exports = Task;
