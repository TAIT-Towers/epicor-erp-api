#!/usr/bin/node --harmony

const connection = require('./sample-connection')

const sampleCustomer = {
  CustID: '556',
  Name: 'Customer Test Five'
}

connection.Customer.update(sampleCustomer)
  .then(result => {
    console.log('Customer update', result)
  })
  .catch(error => {
    console.log('there was an error', error)
  })
