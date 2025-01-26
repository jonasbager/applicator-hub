import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
}

export async function scrapeJobs(keywords: string[], location: string): Promise<ScrapedJob[]> {
  console.log('Starting job scraping with:', { keywords, location });
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const jobs: ScrapedJob[] = [];
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // LinkedIn Jobs
    console.log('Scraping LinkedIn jobs...');
    const searchQuery = encodeURIComponent(`${keywords.join(' ')} ${location}`);
    await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${searchQuery}&location=${encodeURIComponent(location)}&f_TPR=r86400`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for job cards to load
    await page.waitForSelector('.jobs-search__results-list li', { timeout: 10000 })
      .catch(() => console.log('No LinkedIn job cards found'));

    const linkedinJobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.jobs-search__results-list li');
      return Array.from(jobCards, card => {
        const titleEl = card.querySelector('.base-search-card__title');
        const companyEl = card.querySelector('.base-search-card__subtitle');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('a.base-card__full-link');
        
        return {
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          url: linkEl?.getAttribute('href') || '',
          description: '' // Will be fetched individually
        };
      });
    });

    console.log(`Found ${linkedinJobs.length} LinkedIn jobs`);

    // Fetch job descriptions
    for (const job of linkedinJobs) {
      if (!job.url) continue;
      
      try {
        await page.goto(job.url, { waitUntil: 'networkidle0', timeout: 20000 });
        await page.waitForSelector('.show-more-less-html__markup', { timeout: 5000 });
        
        const description = await page.evaluate(() => {
          const descEl = document.querySelector('.show-more-less-html__markup');
          return descEl?.textContent?.trim() || '';
        });
        
        job.description = description;
        jobs.push(job);
      } catch (error) {
        console.error(`Error fetching job description for ${job.url}:`, error);
      }
    }

    // Indeed Jobs
    console.log('Scraping Indeed jobs...');
    await page.goto(`https://www.indeed.com/jobs?q=${searchQuery}&l=${encodeURIComponent(location)}&fromage=1`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await page.waitForSelector('.job_seen_beacon', { timeout: 10000 })
      .catch(() => console.log('No Indeed job cards found'));

    const indeedJobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.job_seen_beacon');
      return Array.from(jobCards, card => {
        const titleEl = card.querySelector('.jobTitle');
        const companyEl = card.querySelector('.companyName');
        const locationEl = card.querySelector('.companyLocation');
        const descEl = card.querySelector('.job-snippet');
        const linkEl = card.querySelector('a.jcs-JobTitle');
        
        return {
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          url: linkEl?.getAttribute('href') ? 'https://www.indeed.com' + linkEl.getAttribute('href') : '',
          description: descEl?.textContent?.trim() || ''
        };
      });
    });

    console.log(`Found ${indeedJobs.length} Indeed jobs`);
    jobs.push(...indeedJobs);

  } catch (error) {
    console.error('Error during job scraping:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  } finally {
    await browser.close();
  }

  console.log(`Total jobs found: ${jobs.length}`);
  return jobs.filter(job => job.title && job.company); // Only return jobs with at least title and company
}
