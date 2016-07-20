const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const xml2js = Promise.promisifyAll(require('xml2js'));
const moment = require('moment');
var path = require('path');

function run(input){
  var parser = new xml2js.Parser();
  return fs.readFileAsync(input)
    .then(function(result){
      return parser.parseStringAsync(result);
    })
    .then(function(result){
      var issue = unwrap(unwrap(result.GALENP.Newspaper).issue);
      var published = moment(issue.pf, 'YYYYMMDD');

      var meta = {
        copyright: issue.copyright,
        published: published.toDate(),
        edition: issue.ed
      };

      var pages = [];

      for (var i = 0 ; i < issue.page.length ; i++){

        pages.push({
          id : issue.page[i].pageid[0]._,
          articles : issue.page[i].article
        });
      }

      return {
        meta: meta,
        pages : pages
      };
  });
}

function coordinates(text){
  if (!text){
    return;
  }
  return unwrap(text.pg).$.pos.split(',');
}

function unwrap(obj){
  if (Object.prototype.toString.call(obj) === '[object Array]' && obj.length === 1){
    return obj[0];
  }
  return false;
}

module.exports = {
  run: run,
  coordinates: coordinates,
  unwrap: unwrap
}
