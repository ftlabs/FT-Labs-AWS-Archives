#!/usr/bin/env node

var xmlParser = require('./xml-parser');
var imageProcessing = require('./image-processing');

var directory = '/Users/peter.clark/Documents/1939/19390216/';
var workingDirectory = require('process').cwd();

xmlParser.run().then(function(data){
  for (i in data.articles){
    imageProcessing.process(data.articles[i]);
  }
}).catch(function(err){
  console.log(err);
});
