import os
import sys
import time
import random
import socket
import logging
import urllib, urllib2, cookielib
from threading import Thread, Condition

logger = logging.getLogger('concurrent crawler')
handler = logging.StreamHandler()
logger.addHandler(handler) 
logger.setLevel(logging.INFO)

socket.setdefaulttimeout(5)

class HttpOpener:
    def __init__(self, ip="127.0.0.1", useragent=None, args=None):
        cj = cookielib.CookieJar()

        if ip != "127.0.0.1" and ip != "localhost":
            px = urllib2.ProxyHandler({'http': ip})
            self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj), px)
        else:
            self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))

        if not useragent:
            useragent = "Mozilla/5.0 (Windows; U; Windows NT 6.1; ru; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3"

        self.opener.addheaders = [("User-Agent", useragent)]

    def set_header(self, label, value):
        self.rm_header(label)
        self.opener.addheaders.append((label, value))

    def rm_header(self, label):
        self.opener.addheaders = [x for x in self.opener.addheaders if x[0] != label]

    def get(self, url, post=None):
        if post:
            return self.opener.open(url, urllib.urlencode(post)).read()

        return self.opener.open(url).read()


class CrawlerThread(Thread):
    def __init__(self, id, parent):
        Thread.__init__(self)
        self.sec = id
        self.parent = parent
        self.master_current_task = None
        self.master_current_url = None
        self.master_current_referer = None
        self.master_current_post = None
        self.idx = 0
        self.proxy = None

    def resetProxy(self):
        self.proxies = self.parent.proxies
        random.shuffle(self.proxies)
        self.idx = 0
        self.proxy = self.proxies[0]

    def nextProxy(self):
        if self.idx + 1 == len(self.proxies):
            return None

        self.idx = (self.idx+1) % len(self.proxies)
        self.proxy = self.proxies[self.idx]
        return self.proxy

    def run(self):
        logger.debug("Thread %d started", self.sec)
        while True:
            self.waitForTask()
            self.doTask()

    def waitForTask(self):
        self.parent.cond_start.acquire()
        self.parent.cond_start.wait()
        self.parent.cond_start.release()

    def setMasterCurrentTask(self, n, url, referer, post):
        self.master_current_task = n
        self.master_current_url = url
        self.master_current_referer = referer
        self.master_current_post = post

    def doTask(self):

        self.resetProxy()

        while True:
            success = True

            # To avoid a situation that thread is working on outdated task
            self.parent.cond_ready.acquire() 
            my_current_task = self.master_current_task
            my_current_url = self.master_current_url
            my_current_referer = self.master_current_referer
            my_current_post = self.master_current_post
            self.parent.cond_ready.release()
    
            try:
                opener = HttpOpener(self.proxy[0], self.proxy[1])   # ('127.0.0.1', 'mozilla')
                if my_current_referer:
                    opener.set_header("Referer", my_current_referer)
                html = opener.get(my_current_url, post=my_current_post)
                logger.debug("Thread[%d] downloaded %d bytes", self.sec, len(html))

                # TODO: be more precise
            except Exception, e:
                self.parent.handleProxyErr(self.proxy[0], str(e))
                success = False
                html = ""
                logger.debug("Thread[%d] exception %s", self.sec, str(e))

            self.parent.cond_ready.acquire()

            # No more tasks => exit.
            if self.master_current_task == None:
                logger.debug("Thread[%d] finished but task is None", self.sec)
                self.parent.cond_ready.release()
                return

            # Current task has changed meanwhile => continue with the new one.
            if my_current_task != self.master_current_task:
                logger.debug("Thread[%d] finished but with outdated task", self.sec)
                self.resetProxy()
                self.parent.cond_ready.release()
                continue

            # No result but still some proxy => continue.
            if not success and self.nextProxy():
                logger.debug("Thread[%d] will try with another proxy", self.sec)
                self.parent.cond_ready.release()
                continue

            # Success or ran out of proxy => exit.
            logger.debug("Thread[%d] finished as the first one", self.sec)
            self.parent.crawled_data['html'] = html
            self.parent.stopAll()
            self.parent.cond_ready.notify()
            self.parent.cond_ready.release()

            return


class ConcurrentCrawler:
    def __init__(self, nthreads, proxy=[('127.0.0.1', '')]):
        self.nthreads = nthreads
        self.threads = []
        self.cond_ready = Condition()
        self.cond_start = Condition()
        self.crawled_data = {}
        self.proxies = proxy
        self.iterations = 0

        for i in xrange(0, self.nthreads):
            t = CrawlerThread(i, self)
            t.start()
            self.threads.append(t)

        logger.info("pool of %d crawlers initialized", self.nthreads)
        time.sleep(1)

    def stopAll(self):
        for t in self.threads:
            t.setMasterCurrentTask(None, None, None, None)

    def startAll(self, n, url, referer, post):
        self.cond_ready.acquire() 
        for t in self.threads:
            t.setMasterCurrentTask(n, url, referer, post)
        self.cond_ready.release() 

        self.cond_start.acquire()
        self.cond_start.notifyAll()
        self.cond_start.release()


    def crawl(self, url, callback, callback_data=None, referer=None, post=None):
        self.startAll(self.iterations, url, referer, post)
        self.iterations += 1
        self.cond_ready.acquire()
        self.cond_ready.wait()
        self.stopAll()
        self.cond_ready.release()
        callback(url, self.crawled_data, callback_data)
        return self

    def close(self):
        os.kill(os.getpid(), 9)


    def handleProxyErr(self, ip, desc):
        if len(self.proxies) < 20 or "urlopen error timed out" in desc or "'ascii' codec can't encode" in desc:
            return

        self.proxies = filter(lambda x: x[0] != ip, self.proxies)
        print "Proxy removed, got", len(self.proxies)


if __name__ == "__main__":

    def onGithubHtml(url, crawled_data, *args):
        print 'retrieved %s bytes from %s' % (len(crawled_data['html']), url)

    ConcurrentCrawler(5).crawl("http://github.com", callback=onGithubHtml).close()

    """
    crawler = ConcurrentCrawler(1)
    crawler.crawl("http://github.com", callback=onGithubHtml, callback_data='first one')
    crawler.crawl("http://github.com", callback=onGithubHtml, callback_data='second one')
    crawler.crawl("http://github.com", callback=onGithubHtml, callback_data='third one')
    crawler.close()
    """
