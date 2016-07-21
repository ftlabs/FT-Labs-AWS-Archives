#!/usr/bin/env node

const fs = require('fs');
var co = require('co');
var walk = require('walk');
const dotenv = require('dotenv').config();
const uuid = require('uuid').v4;

var imageProcessing = require('./image-processing');

const tmpPath = process.env.TMPPATH || '/tmp/';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();


function lambda(event, context, callback){

	console.log(event);

	const random = uuid();

	const resourcePath = event.path;
	const parentPageID = event.id.substring(0, event.id.lastIndexOf('-'));
	const articleSections = event.coordinates;

	console.log("resourcePath:", resourcePath, "parentPageID:", parentPageID, "articleSections:", articleSections);

	console.log(`${resourcePath}${parentPageID}.JPG`);

	const destination = `${tmpPath}${random}.jpg`;
	const file = fs.createWriteStream(destination);
	S3.getObject({
		Bucket : 'ftlabs-archives-articles',
		Key : `${resourcePath}${parentPageID}.JPG`
	}).createReadStream().pipe(file);

	file.on('error', function(e){
		console.log("error event");
		console.log(e);
	});

	file.on('close', function(e){
		console.log(`File recieved from S3 and written to ${destination}`);
		imageProcessing.process(destination, articleSections)
			.then(img => {
				console.log('img:', img);
			})
		;
	});
}

exports.handle = lambda;

/*lambda({
	id : 'FTDA-1939-0105-0005-001',
	path : '1939/19390105/',
	coordinates : [['76','1216','936','7132'],['900','1216','1696','7132']]
});*/
