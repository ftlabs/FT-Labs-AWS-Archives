const spawn = require('child_process').spawn;

function extractTarFileToTmp(file){

	return new Promise( (resolve, reject) => {

		const t = spawn('tar', ['-xvf', file, '-C', '/tmp']);

		t.on('close', (code) => {

			console.log(outputDestination);

			if(code === 1){
				console.log('Tar exited with 1');
				reject('Something went wrong with Tesseract');
			} else if(code === 0){
				console.log("tar closed and was happy")
				resolve();
			}
		});

	} );

}

module.exports = {
	extract : extractTarFileToTmp
};