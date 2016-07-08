const debug = require('debug')('scan-the-slices:lib:tesseract.js');
const spawn = require('child_process').spawn;
const uuid = require('uuid').v4;
const fs = require('fs');

module.exports = function(source){

	return new Promise( (resolve, reject) => {

		const randomOut = uuid();

		const tess = spawn('tesseract', [source, `./bin/tmp/out/${randomOut}`])
		const buff = [];

		tess.on('close', (code) => {
			if(code === 1){
				reject("Something went wrong with Tesseract");
			} else if(code === 0){
				fs.readFile(`./bin/tmp/out/${randomOut}.txt`, 'utf8', function (err,data) {
					resolve(data);
				});
			}
		});


	});

}