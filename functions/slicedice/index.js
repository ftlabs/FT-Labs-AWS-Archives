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

/*
{ 
	'Type': 'Notification',
	'MessageId': '1ce7a77d-d9d8-5a6e-9445-f771d9ab11ba',
	'TopicArn': 'arn:aws:sns:us-west-2:810385116814:ftlabs-archives-sns',
	'Subject': 'null',
	'Message': '{"id":"FTDA-1939-0105-0004-001","coordinates":[["5","1410","910","7130"],["875","1395","1700","7130"],["1660","205","2470","7130"],["2445","6185","3230","7130"]],"title":"Burma Corporation Limited (Incorporated in Burma)",}',
	'Timestamp': '2016-07-22T11:06:27.343Z',
	'SignatureVersion': '1',
	'Signature': 'ZK+UfB2ubNYAKGefYYNo6//Rg7lz1uKqZs7dxPZ9ODnX9ZgaPcJiFkhhiwBTnWBAk2x1BbcAKipJapddFMabA7B7UdYm04N859dqhpmjaQICWGYLPRtF8W823hupTih6ItwN932zQXjIL4j4PuCY/45bqPdp1a8x8PZRw8XTFe7CaXyAwdHWUNK8l4A2f9YO7emPOhbLLX4pMGp8mHQUVmqcJdyAOrnkXe9axxiPZrzRkk+6KfG9jbeednxTQUy4N41Jt1C3x+JP1+d0EO/BjVGDIAXvn504r81OAGkkvAncN1jGp1aShQhrKD3iqtaC0gJPsJsQnZdrq4Jv/1BOYA==',
	'SigningCertUrl': 'https://sns.us-west-2.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem',
	'UnsubscribeUrl': 'https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:810385116814:ftlabs-archives-sns:bb841134-c115-4694-a8ba-a81756ebde0b',
	'MessageAttributes': {}
}
*/

function lambda(event, context, callback){

	console.log(event);

	/*const random = uuid();

	const resourcePath = event.path;
	const parentPageID = event.id.substring(0, event.id.lastIndexOf('-'));
	const articleSections = event.coordinates;*/

	const SNSContent = event.Resource[0].Sns;
	const SNSData = JSON.parse(SNSContent.Message);

	const random = uuid();

	const resourcePath = SNSData.path;
	const parentPageID = SNSData.id.substring(0, event.id.lastIndexOf('-'));
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
		imageProcessing.process(destination, articleSections)
			.then(img => {
				console.log('img:', img);

				fs.readFile(img.path, (err, data) => {
					if(err){
						console.log("Error reading spliced image:", err);
					} else {
	
						new AWS.S3({
							params : {
								Bucket : 'ftlabs-archives-snippets',
								Key : `${event.id}.jpg`
							}
						}).upload({Body : data}, function(){
							console.log(`Snippet ${event.id}.jpg successfully uploaded`);
						});

					}

				});

			})
		;
	});
}

exports.handle = lambda;
