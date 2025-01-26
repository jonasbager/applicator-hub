import scrapy
from urllib.parse import urlencode
from typing import List

class AggregatorJobScraper(scrapy.Spider):
    name = "aggregator_job_scraper"

    def __init__(self, keywords: List[str], location: str, *args, **kwargs):
        super(AggregatorJobScraper, self).__init__(*args, **kwargs)
        self.keywords = keywords
        self.location = location

    def start_requests(self):
        # LinkedIn Jobs
        linkedin_params = {
            'keywords': ' '.join(self.keywords),
            'location': self.location,
            'f_TPR': 'r86400',  # Last 24 hours
            'start': 0
        }
        linkedin_url = f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?{urlencode(linkedin_params)}'
        yield scrapy.Request(url=linkedin_url, callback=self.parse_linkedin)

        # Indeed Jobs
        indeed_params = {
            'q': ' '.join(self.keywords),
            'l': self.location,
            'fromage': '1'  # Last 24 hours
        }
        indeed_url = f'https://www.indeed.com/jobs?{urlencode(indeed_params)}'
        yield scrapy.Request(url=indeed_url, callback=self.parse_indeed)

        # Jobindex (Danish job board)
        jobindex_params = {
            'q': ' '.join(self.keywords),
            'location': self.location,
            'period': '1'  # Last 24 hours
        }
        jobindex_url = f'https://www.jobindex.dk/jobsoegning?{urlencode(jobindex_params)}'
        yield scrapy.Request(url=jobindex_url, callback=self.parse_jobindex)

        # The Hub (Danish tech jobs)
        thehub_params = {
            'q': ' '.join(self.keywords),
            'location': self.location
        }
        thehub_url = f'https://thehub.io/jobs?{urlencode(thehub_params)}'
        yield scrapy.Request(url=thehub_url, callback=self.parse_thehub)

    def parse_linkedin(self, response):
        jobs = response.css('.job-search-card')
        for job in jobs:
            yield {
                'source': 'LinkedIn',
                'title': job.css('.base-search-card__title::text').get('').strip(),
                'company': job.css('.base-search-card__subtitle::text').get('').strip(),
                'location': job.css('.job-search-card__location::text').get('').strip(),
                'url': job.css('a.base-card__full-link::attr(href)').get(''),
                'description': job.css('.base-search-card__metadata::text').get('').strip()
            }

    def parse_indeed(self, response):
        jobs = response.css('.job_seen_beacon')
        for job in jobs:
            yield {
                'source': 'Indeed',
                'title': job.css('.jobTitle::text').get('').strip(),
                'company': job.css('.companyName::text').get('').strip(),
                'location': job.css('.companyLocation::text').get('').strip(),
                'url': 'https://www.indeed.com' + job.css('a.jcs-JobTitle::attr(href)').get(''),
                'description': job.css('.job-snippet::text').get('').strip()
            }

    def parse_jobindex(self, response):
        jobs = response.css('.PaidJob')
        for job in jobs:
            yield {
                'source': 'Jobindex',
                'title': job.css('.PaidJob-inner h2 a::text').get('').strip(),
                'company': job.css('.Company::text').get('').strip(),
                'location': job.css('.Location::text').get('').strip(),
                'url': response.urljoin(job.css('.PaidJob-inner h2 a::attr(href)').get('')),
                'description': job.css('.PaidJob-inner .jobtext::text').get('').strip()
            }

    def parse_thehub(self, response):
        jobs = response.css('.styles__JobCard-sc-__sc-1fx5e0d-1')
        for job in jobs:
            yield {
                'source': 'The Hub',
                'title': job.css('.styles__Title-sc-__sc-1fx5e0d-6::text').get('').strip(),
                'company': job.css('.styles__CompanyName-sc-__sc-1fx5e0d-8::text').get('').strip(),
                'location': job.css('.styles__Location-sc-__sc-1fx5e0d-7::text').get('').strip(),
                'url': response.urljoin(job.css('a::attr(href)').get('')),
                'description': job.css('.styles__Description-sc-__sc-1fx5e0d-9::text').get('').strip()
            }
