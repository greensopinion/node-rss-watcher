
/* Module DEPENDENCIES */

(function() {
  var Watcher, cnumber, color, colors, moment, path, program, rendering, watcher;

  program = require("commander");

  colors = require('colors');

  moment = require('moment');

  colors.setTheme({
    time: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'blue'
  });

  color = ["white", 'yellow', 'cyan', 'magenta', 'red', 'green', 'blue'];

  cnumber = 0;

  program.version("1.2.0").option("-f, --feed [String]", "RSS/Atom feed URL (required)").option("-i, --interval [Number]", "fetch interval (optional)", parseInt).option("-u, --nourl [Bool]", "Don't show articles url (optional)").option("-s, --site [Bool]", "show sitename (optional)").parse(process.argv);

  path = require('path');

  Watcher = require('./watcher');

  watcher = new Watcher(program.feed);

  watcher.on('error', function(error) {
    return console.error(error);
  });

  watcher.on('new article', function(article) {
    return rendering(article);
  });

  watcher.set(program.interval > 0 ? {
    interval: program.interval
  } : void 0);

  watcher.run(function(err, articles) {
    var article, _i, _len, _results;
    if (err) {
      throw new Error(err);
    }
    _results = [];
    for (_i = 0, _len = articles.length; _i < _len; _i++) {
      article = articles[_i];
      _results.push(rendering(article));
    }
    return _results;
  });

  rendering = function(article) {
    var date, seed, site, text, title, url;
    seed = article.pubDate / 1000;
    cnumber = seed % color.length;
    date = "[" + (moment(article.pubDate).format("(ddd) HH:mm")) + "]";
    title = article.title;
    site = article.meta.title;
    url = article.meta.link;
    text = "";
    text = "" + date.time + " " + title[color[cnumber]];
    if (program.site != null) {
      text = text + (" - " + site);
    }
    if (program.nourl == null) {
      text = text + (" " + url.underline);
    }
    return console.log(text);
  };

}).call(this);
