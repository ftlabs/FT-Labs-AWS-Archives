// Imagemagick binary acquired from:
// https://github.com/DoubleDor/imagemagick-prebuilt/releases

/*const gmPaths = [
  `/tmp/resources/imagemagick/lib`,
  `/tmp/resources/imagemagick/bin`,
];

console.log("PATH:", process.env['PATH']);
process.env['PATH'] += `:${gmPaths.join(':')}`;
console.log("ADJ PATH:", process.env['PATH']);*/

var Promise = require('bluebird');
var gm = require('gm').subClass({imageMagick: true});
var path = require('path');
var co = require('co');
var tmp = require('tmp');
const tar = require('./tar');
const random = require('uuid').v4;

var fs = Promise.promisifyAll(require('fs'));
Promise.promisifyAll(gm.prototype);

module.exports = {
  process: co.wrap(function * (filePath, coordinates) {

    var pic = filePath;
    console.log(pic);
    var tempFiles = [];
    for ( var i = 0; i < coordinates.length; i += 1 ) {
      var bounds = coordinates[i];
      console.log(bounds);
      var cropped = crop(pic, bounds);
      var tempFile = tmp.fileSync({
        dir : '/tmp'
      });
      console.log('Appended to file', tempFile.name);
      yield cropped.writeAsync(tempFile.name);
      console.log("Got past yield...");
      tempFiles.push(tempFile.name);
      console.log("tempFiles.length:", tempFiles.length);
    }

    console.log("The first temp file:", tempFiles[0]);

    var image = gm(tempFiles[0]);
    for (var i = 1 ; i < tempFiles.length ; i++){
      image.append(tempFiles[i]);
    }

    const finalName = random();
    const stitchOutputPath = `/tmp/${finalName}.jpg`;
    yield image.writeAsync(stitchOutputPath);
    console.log("We've been stitched up at:", stitchOutputPath);
    return {
      path : stitchOutputPath
    };
  }),
  ready: function(){

    return tar.extract(`${__dirname}/../resources/imagemagick.tar.gz`);

  }
};

function append(image, append){
  if (!image){
    return gm(append);
  }
  return image.append(to);
}

function crop(pic, pos){
  console.log("CROP:", pic);
  return gm(pic).crop(
    pos[2] - pos[0],
    pos[3] - pos[1],
    pos[0],
    pos[1]
  );
}
