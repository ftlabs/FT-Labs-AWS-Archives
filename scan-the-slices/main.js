require('node-babel')();

const dotenv = require('dotenv').config();

const S3rver = require('s3rver');
const argv = require('yargs').argv; 
const debug = require('debug')('scan-the-slices:main.js');

const tesseract = require('./lib/tesseract');

if(process.env.ENVIRONMENT === 'DEVELOPMENT'){
	
	// We're going to fire up a fake S3 server
	debug("In development environment. Firing up fake S3 server...");

	const S3Server = new S3rver({
		port : 7890,
		hostname: 'localhost',
		silent: true,
		directory: './bin/s3/'
	}).run();

}

const sourceDocument = argv.src;

debug(sourceDocument);

if(sourceDocument !== undefined){
	// ./bin/s3/FTDA-1940-0706-0002-003.jpg
	tesseract(sourceDocument, true)
		.then(res => {
			console.log(res);

			const formattedText = res[0];
			const boundedText = res[1];

		})
		.catch(err => {
			console.log(err);
		})
	;

}
