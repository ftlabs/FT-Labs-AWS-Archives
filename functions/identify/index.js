require('node-babel')();

const dotenv = require('dotenv').config();

const debug = require('debug')('scan-the-slices:main.js');
const AWS = require("aws-sdk");
const argv = require('yargs').argv;
const uuid = require('uuid').v4;
const co = require('co');
const fs = require('fs');
const tmpPath = process.env.TMPPATH || '/tmp/';

const xmlParser = require('./xml-parser');

const S3 = new AWS.S3();
const SQS = new AWS.SQS({region:'us-west-2'});

function addArticleToQueue(d){

	return new Promise( (resolve, reject) => {

		SQS.sendMessage({
			MessageBody : JSON.stringify(d),
			QueueUrl : process.env.AWS_QUEUE_ENDPOINT
		}, function(err, data){

			if(err){
				console.log("SQS Error:", err);
				reject()
			} else {
				resolve();				
			}

		});

	});
	
}

function lambda(event, context, callback){
	
	console.log(event);

	const random = uuid();

	const XMLSrc = event.Records[0].s3.object.key;
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
			var totalArticleCount = 0;
			data.pages.forEach(page => {
				console.log("This page has", page.articles.length, 'articles');
				totalArticleCount += page.articles.length;
				page.articles.forEach(article => {
					if(article.text){
						
						const data = {
							id : xmlParser.unwrap(article.id),
							path : XMLPath,
							coordinates : xmlParser.unwrap(article.text)['text.cr'].map(t => {
								return xmlParser.coordinates(t);
							}),
							title : article.ti[0],
							taglines : article.ta
						};

						addArticleToQueue(data)
							.catch(err => {
								console.log("An error occurred posting a message to the SQS queue", err);
							})
						;

					}

				});
			})

		});

	});

}

exports.handle = lambda;

/*lambda({
	"XML" : "1939/19390105/FTDA-1939-0105.xml"
});*/