Use case: You have a pool of 100 proxies which you use to crawl data. It is likely that some proxies are slow or refuse connection. To have a good latency, you can start for example 5 concurrent request for given url and you get a response as soon as any of requests is completed.

def onGithubHtml(url, crawled_data, *args):
        print 'retrieved %s bytes from %s' % (len(crawled_data['html']), url)

    ConcurrentCrawler(5).crawl("http://github.com", callback=onGithubHtml).close()

