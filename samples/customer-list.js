#!/usr/bin/node --harmony

const connection = require('./sample-connection')

connection.Customer.find("CustID = '100'")
  .on('data', result => {
    console.log('Got result', result)
  })
  .on('error', err => {
    console.log('there  was an error', err)
  })
  .on('end', () => {
    console.log('finished reading data')
  })
