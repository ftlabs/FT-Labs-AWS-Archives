#!/usr/bin/env node

var co = require('co');
var walk = require('walk');
const dotenv = require('dotenv').config();

var xmlParser = require('./xml-parser');
var imageProcessing = require('./image-processing');

var argv = require('yargs')
	.usage('Usage: $0 --scan [directory] --output [num]')
	.demand(['scan','output'])
	.argv;

var scan = argv.scan;
var output = argv.output;

console.log(scan);
var walker = walk.walk(scan, {followLinks: false});

walker.on("file", function(root, fileStat, next){
	if (fileStat.name.endsWith('.xml')){
		co(function * (){
			var data = yield xmlParser.run(root + '/' + fileStat.name);
			console.log('Processing', data.meta);
			for (i in data.articles) {
				yield imageProcessing.process(root, data.articles[i], output);
			}
			next();
		}).catch(function(err){
			next();
			console.log(err);
		});
	} else {
		next();
	}
});

// exports.handle = lambda;
