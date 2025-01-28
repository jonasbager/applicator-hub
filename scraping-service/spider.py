import scrapy
from scrapy.crawler import CrawlerProcess
import json
import os

class JobindexSpider(scrapy.Spider):
    name = 'jobindex'
    
    def __init__(self, keywords=None, location=None, *args, **kwargs):
        super(JobindexSpider, self).__init__(*args, **kwargs)
        self.keywords = keywords or 'developer'
        self.location = location or 'denmark'
        # Format URL with search parameters
        self.start_urls = [
            f'https://www.jobindex.dk/jobsoegning?q={self.keywords}&location={self.location}'
        ]
        print(f'Starting spider with URL: {self.start_urls[0]}')

    def parse(self, response):
        print(f'Parsing response from {response.url}')
        
        # Find all job listings
        jobs = response.css('.jobsearch-result')
        print(f'Found {len(jobs)} jobs')
        
        for job in jobs:
            try:
                # Extract job details
                title = job.css('h4 a::text').get()
                company = job.css('.jix-toolbar-top strong::text').get()
                url = job.css('h4 a::attr(href)').get()
                description = job.css('.job-text::text').get()
                
                # Clean up the data
                title = title.strip() if title else ''
                company = company.strip() if company else ''
                description = description.strip() if description else ''
                
                # Make URL absolute
                if url and not url.startswith('http'):
                    url = f'https://www.jobindex.dk{url}'
                
                print(f'Extracted job: {title} at {company}')
                
                yield {
                    'position': title,
                    'company': company,
                    'location': 'Denmark',
                    'url': url,
                    'description': description,
                    'source': 'Jobindex'
                }
            except Exception as e:
                print(f'Error extracting job: {e}')
                continue

def scrape_jobs(keywords=None, location=None):
    print('Starting job scraping...')
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Configure the crawler process
    process = CrawlerProcess({
        'USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': True,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': False,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    })
    
    # Create a list to store the results
    results = []
    
    # Define pipeline to collect items
    def collect_items(item, spider):
        results.append(item)
        return item
    
    # Add pipeline to process
    process.spider = JobindexSpider
    process.spider.custom_settings = {
        'ITEM_PIPELINES': {'__main__.collect_items': 100}
    }
    
    # Run the spider
    process.crawl(JobindexSpider, keywords=keywords, location=location)
    process.start()
    
    # Save results to file
    with open('data/jobs.json', 'w') as f:
        json.dump(results, f, indent=2)
    print(f'Saved {len(results)} jobs to data/jobs.json')
    
    return results

if __name__ == '__main__':
    scrape_jobs()
