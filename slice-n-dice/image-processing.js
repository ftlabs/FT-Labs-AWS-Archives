var Promise = require('bluebird');
var gm = require('gm');
var path = require('path');
var co = require('co');
var tmp = require('tmp');

var xmlParser = Promise.promisifyAll(require('./xml-parser'));
var fs = Promise.promisifyAll(require('fs'));
Promise.promisifyAll(gm.prototype);

module.exports = {
  process: co.wrap(function * (directory, article, output) {
    var pic = path.resolve(directory, xmlParser.unwrap(article.pi)._ + '.jpg');
    var articleGroup = xmlParser.unwrap(article.text);
    var title = article.id[0];

    var tempFiles = [];
    for (type in articleGroup) {
      for (index in articleGroup[type]){
        var section = articleGroup[type][index];
        var pos = xmlParser.coordinates(section);
        var cropped = crop(pic, pos);

        var tempFile = tmp.fileSync();
        console.log('Appended to file', tempFile.name);
        yield cropped.writeAsync(tempFile.name);
        tempFiles.push(tempFile.name)
      }
    }

    var image = gm(tempFiles[0]);
    for (var i = 1 ; i < tempFiles.length ; i++){
      image.append(tempFiles[i]);
    }

    yield image.writeAsync(output + title + '.jpg');
  })
};

function append(image, append){
  if (!image){
    return gm(append);
  }
  return image.append(to);
}

function crop(pic, pos){
  return gm(pic).crop(
    pos[2] - pos[0],
    pos[3] - pos[1],
    pos[0],
    pos[1]
  );
}
