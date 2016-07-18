require('node-babel')();

const dotenv = require('dotenv').config();

const debug = require('debug')('scan-the-slices:main.js');
const AWS = require("aws-sdk");
const argv = require('yargs').argv;
const uuid = require('uuid').v4;
const co = require('co');
const fs = require('fs');
const tmpPath = process.env.TMPPATH || '/tmp/';

const  xmlParser = require('./xml-parser');

const S3 = new AWS.S3();

function lambda(event, context, callback){
	
	console.log(event);

	const random = uuid();

	const XMLSrc = event.XML;
	const XMLPath = XMLSrc.substring(0, XMLSrc.lastIndexOf("/") + 1);	
	const XMLName = XMLSrc.substring(XMLSrc.lastIndexOf("/") + 1);

	console.log("Source:", XMLSrc, "Path:", XMLPath, "Name:", XMLName);

	const destination = `${tmpPath}${random}.xml`;
	const file = fs.createWriteStream(destination);
	console.log(destination);
	S3.getObject({
		Bucket : 'ftlabs-archives-articles',
		Key : XMLSrc
	}).createReadStream().pipe(file);

	file.on('error', function(e){
		console.log("error event");
		console.log(e);
	});

	file.on('close', function(e){
		console.log(`File recieved from S3 and written to ${destination}`);
		
		co(function * (){
			var data = yield xmlParser.run(destination);

			data.pages.forEach(page => {
				page.articles.forEach(article => {
					console.log(article);
					
				});
			})

		});

	});

}

exports.handle = lambda;

lambda({
	"XML" : "1939/19390105/FTDA-1939-0105.xml"
});