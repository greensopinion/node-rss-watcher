###
#
# watcher.coffee
#
# Author:@nikezono
#
####

{EventEmitter} = require 'events'
parser = require 'parse-rss'

fetchFeed = (feedUrl,callback)=>
  parser feedUrl,(err,articles)=>
    return callback err,null if err?

    articles.sort (a,b)->
      return a.pubDate/1000 - b.pubDate/1000

    return callback null,articles


# Feed Watcher. Allocate one watcher per single feed
class Watcher extends EventEmitter

  constructor:(feedUrl)->
    throw new Error("arguments error.") if not feedUrl or feedUrl is undefined
    super()

    @feedUrl = feedUrl
    @interval = null
    @lastPubDateByLink = {}
    @timer = null
    @watch = =>

      fetch = =>
        fetchFeed @feedUrl,(err,articles)=>
          return @emit 'error', err if err

          for article in articles
            @notifyIfNeeded(article)

      return setInterval ->
        fetch(@feedUrl)
      ,@interval*1000


  set:(obj)->
    flag = false
    if obj.feedUrl?
      @feedUrl  = obj.feedUrl if obj.feedUrl?
      flag = true
    if obj.interval?
      @interval = obj.interval if obj.interval?
      flag = true
    return flag

  notifyIfNeeded:(article)=>
    if @isNewArticle(article)
      @emit 'new article',article
      @updateLastPubDate(article)
    else if (@isUpdatedArticle(article))
      @emit 'updated article',article
      @updateLastPubDate(article)

  updateLastPubDate:(article)=>
    @lastPubDateByLink[article.link] = article.pubDate/1000

  isUpdatedArticle:(article)=>
    lastPubDate = @lastPubDateByLink[article.link]
    return lastPubDate != null and lastPubDate < article.pubDate/1000

  isNewArticle:(article)=>
    return !@lastPubDateByLink[article.link]?

  run:(callback)=>

    initialize = (callback)=>
      fetchFeed @feedUrl,(err,articles)=>
        return callback new Error(err),null if err? and callback?
        for article in articles
          @updateLastPubDate(article)
        @timer = @watch()
        return callback null, articles if callback?

    if not @interval
      @interval = 60 * 5 # 5 minutes... it's heuristic

    return initialize(callback)

  stop:=>
    if not @timer
      throw new Error("RSS-Watcher isnt running now")

    clearInterval(@timer)
    @emit 'stop'



module.exports = Watcher
