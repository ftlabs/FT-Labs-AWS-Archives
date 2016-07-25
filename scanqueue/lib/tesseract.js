const debug = require('debug')('scan-the-slices:lib:tesseract.js');
const spawn = require('child_process').spawn;
const uuid = require('uuid').v4;
const fs = require('fs');

// 'batch.nochop', 'makebox'

const tmpPath = process.env.TMPPATH || '/tmp/';

let tessPath = './resources/tess-dir/tesseract';

const LIB_DIR = `${__dirname}/../resources/tess-dir/lib/`;
const SCRIPT_DIR = `${__dirname}/../resources/tess-dir/`;

process.env['LD_LIBRARY_PATH'] = LIB_DIR;
process.env["TESSDATA_PREFIX"] = SCRIPT_DIR;

const tesseract = function(source, bounds){

	return new Promise( (resolve, reject) => {

		const randomOut = uuid();

		const args = [source, `${tmpPath}${randomOut}`];
		let format = 'txt';

		if(bounds === true){
			args.push('batch.nochop');
			args.push('makebox');
			format = 'box';
		}

		const tess = spawn(tessPath, args);
		const buff = [];

		tess.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});

		tess.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});

		tess.on('close', (code) => {
			const outputDestination = `${tmpPath}${randomOut}.${format}`

			console.log(outputDestination);

			if(code === 1){
				console.log('Tesseract exited with 1');
				reject('Something went wrong with Tesseract');
			} else if(code === 0){
				console.log("Tesseract closed and was happy")
				fs.readFile(outputDestination, 'utf8', function (err, data) {
					if(err){
						console.log(err);
					}
					resolve( data );
				});
			}
		});

	});

}

module.exports = {
	configure : function(options){
		
		if(options.tessPath !== undefined){
			tessPath = options.tessPath;
		}

	},
	scan : function(source, bounds){

		bounds = bounds || false;

		const scans = [tesseract(source, false)];
		
		if(bounds){
			scans.push(tesseract(source, true));
		}

		return Promise.all(scans);

	}
};