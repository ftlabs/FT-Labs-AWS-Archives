#!/usr/bin/env node

const fs = require('fs');
var co = require('co');
const dotenv = require('dotenv').config();
const uuid = require('uuid').v4;

var imageProcessing = require('./lib/image-processing');

const tmpPath = process.env.TMPPATH || '/tmp/';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();

function lambda(event, context, callback){

	console.log(event);

	/*const random = uuid();

	const resourcePath = event.path;
	const parentPageID = event.id.substring(0, event.id.lastIndexOf('-'));
	const articleSections = event.coordinates;*/
	
	const random = uuid();

	const SNSContent = event.Records[0].Sns;
	const SNSData = JSON.parse(SNSContent.Message);
	
	console.log("SNSContent:", SNSContent, "SNSData", SNSData);

	const resourcePath = SNSData.path;
	const parentPageID = SNSData.id.substring(0, SNSData.id.lastIndexOf('-'));
	const articleSections = SNSData.coordinates;

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

		imageProcessing.ready()
			.then(function(){

				return imageProcessing.process(destination, articleSections)
					.then(img => {
						console.log('img:', img);

						fs.readFile(img.path, (err, data) => {
							if(err){
								console.log("Error reading spliced image:", err);
							} else {
								console.log("Spliced image read from disk:", img.path);
								new AWS.S3({
									params : {
										Bucket : 'ftlabs-archives-snippets',
										Key : `${event.id}.jpg`
									}
								}).upload({Body : data}, function(){
									console.log(`Snippet ${event.id}.jpg successfully uploaded`);
									callback();
								});

							}

						});
		
						console.log("Got past the sync reading of the image");

					})
					.catch(err => {
						console.log("ERR:", err);
					})
				;

			})
			.catch(err => {
				console.log("Error readying tar:", err);
			})
		;

		
	});
}

exports.handle = lambda;
