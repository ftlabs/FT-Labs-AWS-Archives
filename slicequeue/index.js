#!/usr/bin/env node

const fs = require('fs');
var co = require('co');
const dotenv = require('dotenv').config();
const uuid = require('uuid').v4;

var imageProcessing = require('./lib/image-processing');

const tmpPath = process.env.TMPPATH || '/tmp/';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const SQS = new AWS.SQS({region:'us-west-2'});
const Consumer = require('sqs-consumer');

function addScanToQueue(d){

	return new Promise( (resolve, reject) => {

		SQS.sendMessage({
			MessageBody : JSON.stringify(d),
			QueueUrl : process.env.AWS_QUEUE_ENDPOINT
		}, function(err, data){

			if(err){
				console.log("SQS Error:", err);
				reject(err);
			} else {
				resolve();
			}

		});

	});
	
}

const sqsConsumer = Consumer.create({
	queueUrl : 'https://sqs.us-west-2.amazonaws.com/810385116814/ftlabs-archive-xml-queue',
	batchSize : 1,
	handleMessage : (message, done) => {

		console.log("\n\nMessage recieved", new Date());
		console.log('\t', message);
		console.log(JSON.parse(message.Body));

		const random = uuid();

		const data = JSON.parse(message.Body);

		const resourcePath = data.path;
		const parentPageID = data.id.substring(0, data.id.lastIndexOf('-'));
		const articleSections = data.coordinates;

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
					console.log(data);

					fs.readFile(img.path, (err, file) => {
						if(err){
							console.log("Error reading spliced image:", err);
						} else {
							console.log("Spliced image read from disk:", img.path);

							new AWS.S3({
								params : {
									Bucket : 'ftlabs-archives-snippets',
									Key : `${data.id}.jpg`
								}
							}).upload({Body : file}, function(){
								console.log(`Snippet ${data.id}.jpg successfully uploaded`);

								return addScanToQueue(data)
									.then(function(){
										console.log("Item added to the queue for scanning");
										done();
									})
									.catch(err => {
										console.log("Error adding message to the scan queue", err);
									})
								;
								
							});

						}

					});

				})
				.catch(err => {
					console.log("ERR:", err);
				})
			;

		});


	}
});

sqsConsumer.on('error', function(err){

	console.log("An error has occurred with the SQS Consumer:", err);

});

sqsConsumer.start();