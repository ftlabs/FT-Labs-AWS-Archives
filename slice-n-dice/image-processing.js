var Promise = require('bluebird');
var gm = require('gm'),
  xmlParser = Promise.promisifyAll(require('./xml-parser')),
  fs = Promise.promisifyAll(require('fs'));

Promise.promisifyAll(gm.prototype);

function process(article){
  var pic =  module.exports.input + xmlParser.unwrap(article.pi)._ + '.jpg';
  var textBlock = xmlParser.unwrap(article.text);
  var title = article.ti[0];

  var promises = [];
  for (text in textBlock){
    promises.push(first(pic, textBlock[text], module.exports.output + title + '-' + text + '.jpg'));
  }

  console.log('Waiting on promises...');

  Promise.all(promises)
    .then(appendAll(title, textBlock))
    //.then(cleanup(title, textBlock))
    .catch(function(err){
      console.log(err);
    });
}

function first(pic, article, append){
  var segment = article[0];
  var pos = xmlParser.coordinates(segment);

  var firstPromise = crop(pic, pos).writeAsync(append);
  if (article.length === 1){
    console.log('Finished section - ' + append);
    return firstPromise;
  }

  var promise = next(firstPromise, pic, article, 1, append);
  console.log('Finished section - ' + append);
  return promise;
}

function next(promise, pic, article, index, append){
  if (article.length === index){
    return promise;
  }

  var segment = article[index];
  var pos = xmlParser.coordinates(segment);

  var nextPromise = promise.then(function(){
    return crop(pic, pos).writeAsync('tmp.jpg');
  }).then(function(){
    console.log('Appending cropped image to ' + append)
    return gm(append).append('tmp.jpg').writeAsync(append);
  });

  return next(nextPromise, pic, article, index + 1, append);
}

function append(append, file){
  if(!append){
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

function appendAll(title, textBlock){
  var result;
  for(text in textBlock){
    result = append(result, module.exports.output + title + '-' + text + '.jpg');
  }

  console.log('Appending all files into single article.');
  return result.writeAsync(module.exports.output + title + '.jpg');
}

function cleanup(title, textBlock){
  var promises = [];
  for(text in textBlock){
    promises.push(fs.unlinkAsync(module.exports.output + title + '-' + text + '.jpg'));
  }
  return Promise.all(promises);
}

module.exports = {
  input: '/Users/peter.clark/Documents/1939/19390216/',
  output: './output/images/',
  process: process
}
