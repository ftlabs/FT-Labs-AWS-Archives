/**
*   Runs the image processing using the callbacks.. Doesn't append all at the end, and doesn't cleanup. Do not use.
*/

var gm = require('gm');
var xmlParser = require('./xml-parser');
var fs = require('fs');

function process(article){
  var pic =  module.exports.input + xmlParser.unwrap(article.pi)._ + '.jpg';
  var textBlock = xmlParser.unwrap(article.text);
  var title = article.ti[0];

  for (text in textBlock){
    console.log(textBlock[text]);
    processFirst(pic, textBlock[text], module.exports.output + title + '-' + text + '.jpg');
  }
}

function append(append, file){
  if(!append){
    return gm(file);
  }
  return append.append(file);
}

function processFirst(pic, article, append){
  var segment = article[0];
  var pos = xmlParser.coordinates(segment);
  return crop(pic, pos).write(append, function(err){
    if (article.length === 1){
      return;
    }

    processNext(pic, article, 1, append);
  });
}

function processNext(pic, article, index, append){
  var segment = article[index];
  var pos = xmlParser.coordinates(segment);

  return crop(pic, pos).write('tmp.jpg', function(err){
    gm(append).append('tmp.jpg').write(append, function(err){
      if (article.length === index + 1){
        return;
      }

      processNext(pic, article, index + 1, append);
    });
  });
}

function crop(pic, pos){
  return gm(pic).crop(
    pos[2] - pos[0],
    pos[3] - pos[1],
    pos[0],
    pos[1]
  );
}

module.exports = {
  input: '/Users/peter.clark/Documents/1939/19390216/',
  output: './output/images/',
  process: process
}
