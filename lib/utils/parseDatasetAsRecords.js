// extract records from a dataset of related tables.
// It is assumed that the first table in the dataset contains the parent records, and the
// other tables are related lists to be attached to those parent.
module.exports = function parseDatasetAsRecords(dataset, keyField) {
  let index = null;
  let records = [];
  for (let k in dataset) {
    if (Array.isArray(dataset[k]) && dataset[k].length) {
      if (index === null) {
        // index by record id
        index = dataset[k].reduce((acc, r) => {
          acc[r[keyField]] = r;
          return acc;
        }, {});
        records = dataset[k];
      } else {
        // it's an additional table
        for (let r of dataset[k]) {
          const parent = index[r[keyField]];
          if (parent) {
            if (!parent[k]) {
              parent[k] = [];
            }
            parent[k].push(r);
          }
        }
      }
    }
  }
  return records;
};
