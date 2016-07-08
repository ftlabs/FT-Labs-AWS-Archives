#!/usr/bin/env node

var home = require('home');
var co = require('co');
var workingDirectory = require('process').cwd();

var xmlParser = require('./xml-parser');
var imageProcessing = require('./image-processing');
var directory = home.resolve('~/Documents/1939/19390216/');
var output = './output/images/';

// errors can be try/catched
co(function *(){
  var data = yield xmlParser.run(directory);
  for (i in data.articles) {
    imageProcessing.process(directory, data.articles[i], output);
  }
}).catch(onerror);

function onerror(err) {
  // log any uncaught errors
  // co will not throw any errors you do not handle!!!
  // HANDLE ALL YOUR ERRORS!!!
  console.error(err.stack);
}
