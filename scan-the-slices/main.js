require('node-babel')();

const dotenv = require('dotenv').config();

const debug = require('debug')('scan-the-slices:main.js');
const AWS = require("aws-sdk");
const S3rver = require('s3rver');
const argv = require('yargs').argv;
const fs = require('fs');
const validUrl = require('valid-url').isUri;
var First = undefined;

const tesseract = require('./lib/tesseract');

const S3config = {
	s3ForcePathStyle: true,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	endpoint: new AWS.Endpoint(process.env.S3_ENDPOINT)
}

const S3 = new AWS.S3(S3config);

if(process.env.ENVIRONMENT === 'DEVELOPMENT'){
	
	// We're going to fire up a fake S3 server
	debug("In development environment. Firing up fake S3 server...");

	First = new Promise( (resolve, reject) => {

		const S3Server = new S3rver({
			port : 7890,
			hostname: 'localhost',
			silent: true,
			directory: './bin/s3/'
		}).run();

		S3.createBucket({
			Bucket : 'articles'
		}, function(){

			S3.upload({
				Bucket : 'articles',
				Key : 'FTDA-1940-0706-0002-003',			
				Body : fs.readFileSync('./resources/FTDA-1940-0706-0002-003.jpg')
			}, function(){
				resolve();
				console.log('Test file successfully uploaded to fake S3 bucket');
			});

		});

	});

} else {
	First = new Promise.resolve();
}

const resourceID = argv.src;

function scan(doc){
	console.log(doc)
	return tesseract(doc, true)
		.then(res => {
			fs.unlink(doc);
			// Join words that are broken over two lines and remove all new lines from the document

			const formattedText = res[0].replace(/-\n/g, ' ').replace(/\n/g, ' ');
			var boundedText = res[1].split('\n');

			boundedText.pop();
			boundedText = boundedText.map(letterData => {
				letterData = letterData.split(' ');
				letterData.pop();
				return {
					'letter' : letterData.shift(),
					'bounds' : letterData
				};
			});

			return {
				plain : formattedText, 
				bounds : boundedText
			};

		})
		.catch(err => {
			console.log(err);
			fs.unlink(doc);
		})
	;

}

if(resourceID !== undefined){
	// FTDA-1940-0706-0002-003
	// Go and get the image from the URL, store it locally, and then pass it to tesseract

	First.then(function(){
		const destination = `./bin/tmp/in/${resourceID}.jpg`;
		const file = fs.createWriteStream(destination);
		S3.getObject({
			Bucket : 'articles',
			Key : resourceID
		}).createReadStream().pipe(file);

		file.on('error', function(e){
			console.log("error event");
			console.log(e);
		});

		file.on('close', function(e){
			console.log(`File recieved from S3 and written to ${destination}`);
			scan(destination)
				.then(res => {

					console.log(res);
					// Send the data off to a database

				})
			;
		});

	});

}
