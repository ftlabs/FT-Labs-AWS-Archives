var Promise = require('bluebird');
var gm = require('gm');
var xmlParser = Promise.promisifyAll(require('./xml-parser'));
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var co = require('co');

Promise.promisifyAll(gm.prototype);

var next = co.wrap(function *(pic, article, index, append){
  var segment = article[index];
  var pos = xmlParser.coordinates(segment);

  if (article.length === 1) {
    console.log('Finished section - ' + append);
    return yield crop(pic, pos).writeAsync(append);
  }

  yield (crop(pic, pos).writeAsync('tmp.jpg'));
  console.log('Appending cropped image to ' + append)
  yield (gm(append).append('tmp.jpg').writeAsync(append));

  return yield (next(pic, article, index + 1, append));
});

function append(append, file){
  if (!append) {
    return gm(file);
  }
  return append.append(file);
}

function crop(pic, pos){
  return gm(pic).crop(
    pos[2] - pos[0],
    pos[3] - pos[1],
    pos[0],
    pos[1]
  );
}

function cleanup(title, textBlock){
  var promises = [];
  for (text in textBlock) {
    promises.push(fs.unlinkAsync(output + title + '-' + text + '.jpg'));
  }
  return Promise.all(promises);
}

module.exports = {
  process: co.wrap(function *(directory, article, output) {
    var pic = path.resolve(directory, xmlParser.unwrap(article.pi)._ + '.jpg');
    var textBlock = xmlParser.unwrap(article.text);
    var title = article.ti[0];

    for (text in textBlock) {
      yield next(pic, textBlock[text], 0, output + title + '-' + text + '.jpg');
    }

    var result;
    for (text in textBlock) {
      result = append(result, output + title + '-' + text + '.jpg');
      console.log('Appending all files into single article.');
    }
    yield result.writeAsync(output + title + '.jpg');
    yield cleanup(title, textBlock)
  })
};
