(function() {
  /*
   *
   * watcher.coffee
   *
   * Author:@nikezono
   *
   */

  var EventEmitter, Watcher, fetchFeed, parser,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  ({EventEmitter} = require('events'));

  parser = require('parse-rss');

  fetchFeed = (feedUrl, callback) => {
    return parser(feedUrl, (err, articles) => {
      if (err != null) {
        return callback(err, null);
      }
      articles.sort(function(a, b) {
        return a.pubDate / 1000 - b.pubDate / 1000;
      });
      return callback(null, articles);
    });
  };

  // Feed Watcher. Allocate one watcher per single feed
  Watcher = class Watcher extends EventEmitter {
    constructor(feedUrl) {
      if (!feedUrl || feedUrl === void 0) {
        throw new Error("arguments error.");
      }
      super();
      this.notifyIfNeeded = this.notifyIfNeeded.bind(this);
      this.updateLastPubDate = this.updateLastPubDate.bind(this);
      this.isUpdatedArticle = this.isUpdatedArticle.bind(this);
      this.isNewArticle = this.isNewArticle.bind(this);
      this.run = this.run.bind(this);
      this.stop = this.stop.bind(this);
      this.feedUrl = feedUrl;
      this.interval = null;
      this.lastPubDateByLink = {};
      this.timer = null;
      this.watch = () => {
        var fetch;
        fetch = () => {
          return fetchFeed(this.feedUrl, (err, articles) => {
            var article, i, len, results;
            if (err) {
              return this.emit('error', err);
            }
            results = [];
            for (i = 0, len = articles.length; i < len; i++) {
              article = articles[i];
              results.push(this.notifyIfNeeded(article));
            }
            return results;
          });
        };
        return setInterval(function() {
          return fetch(this.feedUrl);
        }, this.interval * 1000);
      };
    }

    set(obj) {
      var flag;
      flag = false;
      if (obj.feedUrl != null) {
        if (obj.feedUrl != null) {
          this.feedUrl = obj.feedUrl;
        }
        flag = true;
      }
      if (obj.interval != null) {
        if (obj.interval != null) {
          this.interval = obj.interval;
        }
        flag = true;
      }
      return flag;
    }

    notifyIfNeeded(article) {
      boundMethodCheck(this, Watcher);
      if (this.isNewArticle(article)) {
        this.emit('new article', article);
        return this.updateLastPubDate(article);
      } else if (this.isUpdatedArticle(article)) {
        this.emit('updated article', article);
        return this.updateLastPubDate(article);
      }
    }

    updateLastPubDate(article) {
      boundMethodCheck(this, Watcher);
      return this.lastPubDateByLink[article.link] = article.pubDate / 1000;
    }

    isUpdatedArticle(article) {
      var lastPubDate;
      boundMethodCheck(this, Watcher);
      lastPubDate = this.lastPubDateByLink[article.link];
      return lastPubDate !== null && lastPubDate < article.pubDate / 1000;
    }

    isNewArticle(article) {
      boundMethodCheck(this, Watcher);
      return this.lastPubDateByLink[article.link] == null;
    }

    run(callback) {
      var initialize;
      boundMethodCheck(this, Watcher);
      initialize = (callback) => {
        return fetchFeed(this.feedUrl, (err, articles) => {
          var article, i, len;
          if ((err != null) && (callback != null)) {
            return callback(new Error(err), null);
          }
          for (i = 0, len = articles.length; i < len; i++) {
            article = articles[i];
            this.updateLastPubDate(article);
          }
          this.timer = this.watch();
          if (callback != null) {
            return callback(null, articles);
          }
        });
      };
      if (!this.interval) {
        this.interval = 60 * 5; // 5 minutes... it's heuristic
      }
      return initialize(callback);
    }

    stop() {
      boundMethodCheck(this, Watcher);
      if (!this.timer) {
        throw new Error("RSS-Watcher isnt running now");
      }
      clearInterval(this.timer);
      return this.emit('stop');
    }

  };

  module.exports = Watcher;

}).call(this);
