require('node-babel')();

const dotenv = require('dotenv').config();
const AWS = require('aws-sdk');

const SQS = new AWS.SQS({region:'us-west-2'}); 

function lambda(event, context, callback){
	console.log(process.env);

	const objectKey = event.Records[0].s3.object.key;
	console.log("The objectKey is:", objectKey);

	const objectKeyIndicatesXMLFile = objectKey.indexOf('.xml') > -1;
	console.log("Is XML that we want to parse?", objectKeyIndicatesXMLFile);

	if(objectKeyIndicatesXMLFile){
		SQS.sendMessage({
			MessageBody : objectKey,
			QueueUrl : process.env.AWS_QUEUE_ENDPOINT
		}, function(err, data){

			if(err){
				console.log("SQS Error:", err);
			}

			console.log("SQS Data:", data);

		});
	}


}

exports.handle = lambda;