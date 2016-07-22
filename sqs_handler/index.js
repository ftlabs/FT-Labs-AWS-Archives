'use strict';

const dotenv = require('dotenv').config();
const AWS = require('aws-sdk');
const Consumer = require('sqs-consumer');
const SNS = new AWS.SNS({
	region : 'us-west-2'
});

const MAX_LAMBDA_INSTANCES = 100;
let numberOfMessagesInFlight = 0;

function sendMessageToSNSForLambda(message){
	
	return new Promise((resolve, reject) => {
		console.log(message);
		numberOfMessagesInFlight += 1;
		SNS.publish({
				TargetArn:'arn:aws:sns:us-west-2:810385116814:ftlabs-archives-sns', 
				Message: JSON.stringify(message)
			}, 
			function(err,data){
				if (err){
					reject(err, message);
				} else {
					console.log("Message was sent, we got the id:", data.MessageId);
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

		sendMessageToSNSForLambda(message.Body)
			.then(function(){

				console.log("Recieved callback from SNS service");

				if(numberOfMessagesInFlight < MAX_LAMBDA_INSTANCES){
					numberOfMessagesInFlight -= 1;
					done();
				} else {
					setTimeout(function(){
						numberOfMessagesInFlight -= 1;
						done();
					}.bind(this), 60 * 1000);
				}


			})
			.catch( (err, msg) => {
				console.log('Error communicating with SNS:\n', err);
				console.log('\tThe message we tried to send was:\n\t', msg);
			})
		;


	}
});


sqsConsumer.on('error', function(err){

	console.log("An error has occurred with the SQS Consumer:", err);

});

sqsConsumer.start();