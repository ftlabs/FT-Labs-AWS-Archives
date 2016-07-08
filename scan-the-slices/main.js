const dotenv = require('dotenv').config();
const fs = require('fs');
const S3rver = require('s3rver');
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

tesseract('./bin/s3/FTDA-1940-0706-0002-003.jpg')
	.then(res => {
		console.log(res);
	})
	.catch(err => {
		console.log(err);
	})
;
