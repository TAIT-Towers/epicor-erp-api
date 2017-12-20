# Epicor ERP API

A wrapper for Epicor ERP REST API.

Warning: methods in this package are built for a specific purpose and may not fit yours!

## Usage

Create a connection:

```
const Epicor = require('epicor-erp-api')

const connection = new Epicor({
  serverUrl: process.env['SERVER_URL'],
  username: process.env['USERNAME'],
  password: process.env['PASSWORD'],
  strictSSL: process.env['SKIP_CERT_VERIFICATION'] !== 'true'
})
```

Access methods on individual services.  Services have a set of common methods as well as some methods specific to the service.

```
const myCustomers = connection.Customers.find('CustNum > \'123\'')
```

## Common methods on services

 * create(record): create a record, populating default values where not supplied.  Returns a promise that will resolve to the created record.
 * update(record) - update a single record, based on the key (specific to the collection / connection).  Throw an error if the record does not exist.  Returns updated record.
    - this does not do any conflict resolution
    - this does not merge values with the existing record, so it will error if certain required fields are not populated
 * get(recordKeyObject) - retrieve an existing record using the given selector (an object with the id populated).  Null if not found.
 * find(whereClause, options): return a stream of record matching the condition.  Available options:
    - pageSize (defaults to 25): how many records to return at one time.  This will automatically retrieve additional pages if available.
    - limit (defaults to 0 = no limit)

## Available Services

### Customers

Wrapper for CustomersSvc.

Specific methods:

 * create will retrieve the default territory
