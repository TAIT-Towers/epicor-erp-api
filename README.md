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
  company: process.env['COMPANY'],
  strictSSL: process.env['SKIP_CERT_VERIFICATION'] !== 'true'
})
```

Access methods on individual services.  Services have a set of common methods as well as some methods specific to the service.

```
const myCustomers = connection.Customers.find('CustNum > \'123\'')
```

## Common methods on services

 * create(record): create a record, populating default values where not supplied.  Returns a promise.
 * update(record, options): update a record, using the key field specific to the service.  The values provided will be merged with the existing record's.  There is only one option:
    - checkRevId: If true, the SysRevID of the provided record will be compared with that of the existing one, and the operation will be rejected if it is more recent
 * find(whereClause, options): returns a stream of record matching the condition.  Available options:
    - pageSize (defaults to 25): how many records to return at one time.  This will automatically retrieve additional pages if available.
    - limit (defaults to 0 = no limit)

## Available Services

### Customers

Wrapper for CustomersSvc.

Specific methods:

 * create will retrieve the default territory
