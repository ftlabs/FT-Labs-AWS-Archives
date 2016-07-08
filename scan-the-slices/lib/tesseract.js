const debug = require('debug')('scan-the-slices:lib:tesseract.js');
const spawn = require('child_process').spawn;
const uuid = require('uuid').v4;
const fs = require('fs');

// 'batch.nochop', 'makebox'

const tesseract = function(source, bounds){

	return new Promise( (resolve, reject) => {

		const randomOut = uuid();

		const args = [source, `./bin/tmp/out/${randomOut}`];
		let format = 'txt';

		if(bounds === true){
			args.push('batch.nochop');
			args.push('makebox');
			format = 'box';
		}

		debug(args);

		const tess = spawn('tesseract', args);
		const buff = [];

		tess.on('close', (code) => {
			const outputDestination = `./bin/tmp/out/${randomOut}.${format}`

			if(code === 1){
				reject('Something went wrong with Tesseract');
			} else if(code === 0){	
				fs.readFile(outputDestination, 'utf8', function (err, data) {
					resolve( data );
					fs.unlink(outputDestination);
				});
			}
		});

	});

}

module.exports = function(source, bounds=false){

	const scans = [];

	scans.push(tesseract(source, false));

	if(bounds === true){
		scans.push(tesseract(source, true));
	}

	return Promise.all(scans);

}