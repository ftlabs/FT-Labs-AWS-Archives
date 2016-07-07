const dotenv = require('dotenv').config();
const fs = require('fs');
const S3rver = require('s3rver');
var debug = require('debug')('scan-the-slices:main.js');

if(process.env.ENVIRONMENT === 'DEVELOPMENT'){
		// We're going to fire up a fake S3 server
		debug("In development environment. Firing up fake S3 server...");
	
		const s3Client = new S3rver({
				port : 7890,
				hostname: 'localhost',
				silent: true,
				directory: '/bin/s3/'
			}).run();
		;


}