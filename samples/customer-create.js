#!/usr/bin/node --harmony

const connection = require('./sample-connection')

const sampleCustomer = {
  CustID: '556',
  Name: 'Customer Test Five'
}

connection.Customer.create(sampleCustomer)
  .then(result => {
    console.log('Customer created with id', result)
  })
  .catch(error => {
    console.log('there was an error', error)
  })
