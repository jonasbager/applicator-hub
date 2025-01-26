import scrapy
from scrapy.crawler import CrawlerProcess

class TheHubSpider(scrapy.Spider):
    name = 'thehub'
    start_urls = ['https://thehub.io/jobs?search=Marketing&countries=Denmark']
    
    def parse(self, response):
        # Extract job listings
        for job in response.css('div.job-posting-card'):
            yield {
                'title': job.css('h3.job-posting-card__title::text').get().strip(),
                'company': job.css('div.job-posting-card__company-name::text').get().strip(),
                'location': job.css('div.job-posting-card__location::text').get().strip(),
                'url': response.urljoin(job.css('a.job-posting-card__link::attr(href)').get()),
                'description': job.css('div.job-posting-card__description::text').get().strip(),
                'source': 'TheHub'
            }

        # Follow pagination
        next_page = response.css('a.pagination__next::attr(href)').get()
        if next_page:
            yield response.follow(next_page, self.parse)

if __name__ == '__main__':
    process = CrawlerProcess({
        'USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'FEED_FORMAT': 'json',
        'FEED_URI': 'data/jobs.json',
        'LOG_LEVEL': 'INFO',
        'LOG_FILE': 'data/spider.log'
    })
    process.crawl(TheHubSpider)
    process.start()
