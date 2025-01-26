from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
from scrapy.crawler import CrawlerProcess
from spider import AggregatorJobScraper
import json

app = FastAPI()

class JobRequest(BaseModel):
    keywords: List[str]
    location: str

@app.post("/scrape-jobs")
async def scrape_jobs(request: JobRequest):
    try:
        # Set up Scrapy crawler
        process = CrawlerProcess(settings={
            "FEEDS": {
                "jobs.json": {"format": "json"},
            },
            "LOG_ENABLED": True,
            "LOG_LEVEL": "INFO",
            "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

        # Run the spider with the provided parameters
        process.crawl(
            AggregatorJobScraper,
            keywords=request.keywords,
            location=request.location
        )
        process.start()

        # Read the results
        with open("jobs.json", "r") as f:
            jobs = json.load(f)

        return {"jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
