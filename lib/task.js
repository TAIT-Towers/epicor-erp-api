const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.Bo.TaskSvc';

class Task extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Task', 'TaskID');
  }

  _getRows(where, pageSize = 100, currentPage = 0) {
    const params = {
      whereClauseTask: where,
      whereClauseTaskCnt: '',
      pageSize,
      absolutePage: currentPage
    };
    return this.makeRequest('GetRows', params).then(results => ({
      dataset: results.returnObj,
      morePage: results.parameters.morePage
    }));
  }

  // Update the key1 value for all the tasks that have matching relatedToFile / key2 / old key 1
  async updateKey1(oldKey1, key2, relatedToFile, newKey1) {
    const {dataset} = await this._getRows(
      `Key1='${oldKey1}' and Key2='${key2}' and RelatedToFile='${relatedToFile}'`
    );
    for (let t of dataset.Task) {
      t.RowMod = 'U';
      t.Key1 = newKey1;
      // not sure why some tasks are created without a type code, but it is required by the API
      if (!t.TypeCode) t.TypeCode = 'TT01';
    }
    await this.makeRequest('Update', {ds: dataset});
  }
}

module.exports = Task;
