require('node-babel')();

const dotenv = require('dotenv').config();

const debug = require('debug')('scan-the-slices:main.js');
const AWS = require("aws-sdk");
const argv = require('yargs').argv;
const fs = require('fs');
const tmpPath = process.env.TMPPATH || '/tmp/';
var getReady = Promise.resolve();

const tesseract = require('./lib/tesseract');

console.log(process.env);

AWS.config.update({
  region: "us-west-2"
});

const S3 = new AWS.S3();
const Consumer = require('sqs-consumer');
const Dynamo = new AWS.DynamoDB.DocumentClient();

function wait(ms){
	return new Promise( (resolve, reject) => {
		setTimeout(function(){
			resolve();
		}, ms);
	} );
}

function addResultsToDatabase(data){
	
	const package = {
		TableName : 'ftlabs-archives-scan-results',
		Item : data
	};

	console.log('\n\n\n\n\n', package);

	return new Promise( (resolve, reject) => {
		
		Dynamo.put(package, (err, result) => {

			if(err){
				reject(err);
			} else {
				console.log('OCR results for resource', data.id, 'successfully added to DynamoDB');
				resolve();
			}

		});

	} );


}

function scan(doc, bounds){
	console.log("Attempting scan of:", doc);

	bounds = bounds || false;

	return tesseract.scan(doc, bounds)
		.then(res => {

			console.log("Scan(s) completed:", res);

			const formattedText = res[0].replace(/-\n/g, ' ').replace(/\n/g, ' ');
			var boundedText = undefined;

			if(res.length > 1){

				boundedText = res[1].split('\n');

				boundedText.pop();
				boundedText = boundedText.map(letterData => {
					letterData = letterData.split(' ');
					letterData.pop();
					return {
						'letter' : letterData.shift(),
						'bounds' : letterData
					};
				});

			}

			const results = {
				plain : formattedText,
				bounds : boundedText || []
			};
			
			return results;


		})
		.catch(err => {
			console.log("An error was thrown whilst scanning the document", err);

		})
	;

}

const sqsConsumer = Consumer.create({
	queueUrl : 'https://sqs.us-west-2.amazonaws.com/810385116814/ftlabs-archive-scan-queue',
	batchSize : 1,
	handleMessage : (message, done) => {

		// console.log("Log Group Name", context.logGroupName, "Log Stream Name", context.logStreamName);
		const data = JSON.parse(message.Body);
		const resource = `${data.id}.jpg`;

		console.log("Resource:", resource);

		tesseract.configure({
			tessPath : process.env.TESSPATH
		});

		if(resource !== undefined){
			// FTDA-1940-0706-0002-003
			// Go and get the image from the URL, store it locally, and then pass it to tesseract

			getReady.then(function(){
				const destination = `${tmpPath}${resource}`;
				const file = fs.createWriteStream(destination);
				console.log(destination)
				S3.getObject({
					Bucket : 'ftlabs-archives-snippets',
					Key : resource
				}).createReadStream().pipe(file);

				file.on('error', function(e){
					console.log("error event");
					console.log(e);
				});

				file.on('close', function(e){
					console.log(`File recieved from S3 and written to ${destination}`);
					
					scan(destination, true)
						.then(res => {

							const plainSize = Buffer.byteLength(res.plain, 'utf8') / 1000;
							const boundSize = Buffer.byteLength( JSON.stringify( res.bounds ), 'utf8') / 1000;

							console.log("Tesseract thinks it completed");
							console.log("The plain results size is:", plainSize, "Kb");
							console.log("The bounds results size is:", boundSize, "Kb");
							// console.log(res);

							data.OCRResults = res;

							addResultsToDatabase(data)
								.then(function(){
									done();
								})
								.catch(err => {
									console.log('Failed to OCR to DynamoDB', err);									
									console.log(err);
								})
							;
							// Send the data off to a database

						})
						.catch(err => {
							console.log("Tesseract didn't like that...");
							console.log(err);
						})
					;
				});

			});

		} else {
			console.log(`'resource' is undefined`);
		}

	}
});

sqsConsumer.on('error', function(err){

	console.log("An error has occurred with the SQS Consumer:", err);

});

sqsConsumer.start();







