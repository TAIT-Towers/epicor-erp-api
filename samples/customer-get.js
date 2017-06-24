#!/usr/bin/node --harmony

const connection = require('./sample-connection')

connection.Customer.get(72)
  .then(result => {
    console.log('got customer', result)
  })
  .catch(error => {
    console.log('there was an error', error)
  })
