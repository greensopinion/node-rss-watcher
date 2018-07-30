(function() {
  //###

  //  CLI.coffee

  //###
  /* Module DEPENDENCIES */
  var Watcher, cnumber, color, colors, moment, path, program, rendering, watcher;

  program = require("commander");

  colors = require('colors');

  moment = require('moment');

  // Color Schema
  colors.setTheme({
    time: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'blue'
  });

  color = ["white", 'yellow', 'cyan', 'magenta', 'red', 'green', 'blue'];

  cnumber = 0;

  // define Option
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

  if (program.interval) {
    watcher.set({
      interval: program.interval
    });
  }

  watcher.run(function(err, articles) {
    var article, i, len, results;
    if (err) {
      throw new Error(err);
    }
    results = [];
    for (i = 0, len = articles.length; i < len; i++) {
      article = articles[i];
      results.push(rendering(article));
    }
    return results;
  });

  rendering = function(article) {
    var date, seed, site, text, title, url;
    seed = article.pubDate / 1000;
    cnumber = seed % color.length;
    date = `[${moment(article.pubDate).format("(ddd) HH:mm")}]`;
    title = article.title;
    site = article.meta.title;
    url = article.meta.link;
    text = "";
    text = `${date.time} ${title[color[cnumber]]}`;
    if (program.site != null) {
      text = text + ` - ${site}`;
    }
    if (program.nourl == null) {
      text = text + ` ${url.underline}`;
    }
    return console.log(text);
  };

}).call(this);
