###
#
# test.coffee
# Author:@nikezono, 2014/06/27
#
###


# dependency
path = require 'path'
assert = require 'assert'

# Feed to test
# FIXME use something does not emit http request,
#       such as mock or stub
feed = "http://nikezono.net/atom.xml"

Watcher = require '../lib/watcher'

describe "rss-watcher",->

  it "can compile",(done)->
    watcher = new Watcher(feed)
    assert.notEqual watcher,null
    done()

  it "can raise error if feed url is null",->
    assert.throws ->
      watcher = new Watcher()
    ,Error

  it "can return error if feed url is invalid",(done)->
    watcher = new Watcher("hoge")
    watcher.run (err,articles)->
      assert.ok(err instanceof Error)
      done()

  it "does not emit any event at first launch",(done)->
    watcher = new Watcher(feed)
    watcher.run (err,articles)->
      assert.ok(0 < articles.length)
      done()

  it "can pass option 'interval' for fetch interval",(done)->
    watcher = new Watcher(feed)
    begin = Date.now()
    assert.ok watcher.set
      feedUrl:feed
      interval:1000
    watcher.run (err,articles)->
      done()

  it "can't pass negative value as option 'interval'",(done)->
    watcher = new Watcher(feed)
    watcher.set
      interval:(freq)->
        return -1000
    watcher.run (err,articles)->
      assert.ok err instanceof Error
      done()

  it "can't pass function that returns not a number",(done)->
    watcher = new Watcher(feed)
    watcher.set
      interval:(freq)->
        return "hoge"
    watcher.run (err,articles)->
      assert.ok err instanceof Error
      done()

  it "tracks multiple articles with the same pubDate",(done)->
    watcher = new Watcher(feed)
    article1 =
      title: 'first title'
      link: 'article1'
      pubDate: new Date('Wed, 18 Jul 2018 22:45:19 +0000')
    article2 =
      title: 'second title'
      link: 'article2'
      pubDate: article1.pubDate
    article3 =
      title: 'third title'
      link: 'article3'
      pubDate: new Date('Wed, 18 Jul 2018 22:45:20 +0000')
    assert(watcher.isNewArticle(article1),'expected article1 to be new')
    
    watcher.updateLastPubDate(article1)
    assert(!watcher.isNewArticle(article1),'expected article1 not to be new')
    assert(watcher.isNewArticle(article2),'expected article2 to be new')
    
    watcher.updateLastPubDate(article2)
    assert(!watcher.isNewArticle(article1),'expected article1 not to be new')
    assert(!watcher.isNewArticle(article2),'expected article2 not to be new')

    assert(watcher.isNewArticle(article3),'expected article3 to be new')
    watcher.updateLastPubDate(article3)
    assert(!watcher.isNewArticle(article1),'expected article1 not to be new')
    assert(!watcher.isNewArticle(article2),'expected article2 not to be new')
    assert(!watcher.isNewArticle(article3),'expected article3 not to be new')
    done()


  it "isNewArticle indicates when an article is new",(done)->
    watcher = new Watcher(feed)
    article1 =
      title: 'first title'
      link: 'article1'
      pubDate: new Date('Wed, 18 Jul 2018 22:45:19 +0000')
    assert(watcher.isNewArticle(article1),'expected article1 to be new')
    watcher.updateLastPubDate(article1)
    assert(!watcher.isNewArticle(article1),'expected article1 not to be new')
    done()

  it "isUpdatedArticle indicates when an article is updated",(done)->
    watcher = new Watcher(feed)
    article1 =
      title: 'first title'
      link: 'article1'
      pubDate: new Date('Wed, 18 Jul 2018 22:45:19 +0000')
    assert(!watcher.isUpdatedArticle(article1),'expected article1 not to be updated')
    watcher.updateLastPubDate(article1)
    assert(!watcher.isUpdatedArticle(article1),'expected article1 not to be updated')
    article1.pubDate = new Date('Wed, 18 Jul 2018 23:00:00 +0000')
    assert(watcher.isUpdatedArticle(article1),'expected article1 to be updated')
    done()


  it "notifies when articles are new or changed",(done) ->
    article1 =
      title: 'first title'
      link: 'a-uri'
      pubDate: new Date('Wed, 18 Jul 2018 22:45:19 +0000')
    article2 =
      title: 'second title'
      link: 'another-uri'
      pubDate: new Date('Wed, 18 Jul 2018 20:45:19 +0000')
    newArticleCount = 0
    updatedArticleCount = 0
    watcher = new Watcher(feed)
    watcher.on("new article",(article)->
      newArticleCount++
    )
    watcher.on("updated article",(article)->
      updatedArticleCount++
    )
    watcher.notifyIfNeeded(article1)
    assert(newArticleCount == 1,"1 new articles")
    assert(updatedArticleCount == 0,"no updated articles")
    watcher.notifyIfNeeded(article1)
    assert(newArticleCount == 1,"1 new articles")
    assert(updatedArticleCount == 0,"no updated articles")
    watcher.notifyIfNeeded(article2)
    assert(newArticleCount == 2,"2 new articles")
    assert(updatedArticleCount == 0,"0 updated articles")
    article2.pubDate = new Date('Wed, 18 Jul 2018 22:45:19 +0000')
    watcher.notifyIfNeeded(article1)
    watcher.notifyIfNeeded(article2)
    assert(newArticleCount == 2,"2 new articles")
    assert(updatedArticleCount == 1,"1 updated articles")
    done()

  it "stop",(done)->
    watcher = new Watcher(feed)
    watcher.run ->
      watcher.on "stop",->
        done()
      watcher.stop()

  it "stop raise error",->
    watcher = new Watcher(feed)
    assert.throws ->
      watcher.stop()
    ,Error

