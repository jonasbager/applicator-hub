import { Handler } from '@netlify/functions';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  let browser = null;
  try {
    console.log('Parsing request body...');
    const { url } = JSON.parse(event.body || '{}');
    if (!url) {
      console.error('No URL provided in request body');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'URL parameter is required' })
      };
    }
    console.log('Processing URL:', url);

    console.log('Launching browser...');
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: {
        width: 1200,
        height: 800
      }
    });

    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Block only non-essential resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url().toLowerCase();
      
      // Block tracking, analytics, and ads
      if (url.includes('analytics') || 
          url.includes('tracking') || 
          url.includes('doubleclick') || 
          url.includes('advertising')) {
        request.abort();
        return;
      }

      // For LinkedIn, allow more resource types
      if (url.includes('linkedin.com')) {
        if (['document', 'stylesheet', 'script', 'xhr', 'fetch'].includes(resourceType)) {
          request.continue();
          return;
        }
      } else {
        // For other sites, be more restrictive
        if (['document', 'stylesheet'].includes(resourceType)) {
          request.continue();
          return;
        }
      }

      request.abort();
    });

    // Simplified CSS
    const hideElementsStyle = `
      body {
        padding: 20px !important;
        margin: 0 auto !important;
        background: white !important;
        max-width: 800px !important;
      }

      /* Hide non-essential elements */
      header:not([class*="job"]):not([class*="description"]),
      footer, nav, aside, iframe, form,
      [role="banner"], [role="navigation"], [role="complementary"],
      [class*="cookie"], [class*="popup"], [class*="modal"], [class*="banner"],
      [class*="advertisement"], [class*="notification"],
      [class*="footer"], [class*="header"]:not([class*="job"]):not([class*="description"]),
      button:not([class*="show-more"]):not([class*="see-more"]) {
        display: none !important;
      }

      /* Show job content */
      main, article, [role="main"],
      [class*="content"], [class*="job"], [class*="description"],
      .jobs-description__content, .jobs-description,
      [class*="job-view-layout"], [class*="details"],
      [class*="top-card"], [class*="description-section"],
      .jobs-unified-top-card, .jobs-unified-top-card__content-container,
      .jobs-unified-top-card__title, .jobs-unified-top-card__subtitle-primary-grouping,
      .jobs-unified-top-card__company-name, .jobs-unified-top-card__job-title,
      .jobs-unified-top-card__subtitle, .jobs-unified-top-card__job-insight,
      .jobs-box__html-content {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-width: 100% !important;
        margin: 0 !important;
        height: auto !important;
        overflow: visible !important;
        position: static !important;
      }

      /* Ensure text is visible */
      * {
        color: black !important;
        background-color: transparent !important;
      }

      /* LinkedIn specific styles */
      .jobs-unified-top-card {
        margin-bottom: 1rem !important;
        padding-bottom: 1rem !important;
        border-bottom: 1px solid #e0e0e0 !important;
      }

      .jobs-unified-top-card__job-title {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin-bottom: 0.5rem !important;
      }

      .jobs-unified-top-card__company-name {
        font-size: 1.2rem !important;
        margin-bottom: 0.5rem !important;
      }

      .jobs-box__html-content {
        font-size: 1rem !important;
        line-height: 1.5 !important;
      }
    `;

    console.log('Setting user agent...');
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36');

    console.log('Navigating to URL...');
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 10000
      });
    } catch (error: any) {
      console.error('Navigation error:', error);
      // Try to continue even if timeout, we might have enough content
    }

    // Add the CSS early
    await page.addStyleTag({ content: hideElementsStyle });

    console.log('Waiting for content...');
    try {
      if (url.includes('linkedin.com/jobs/view/')) {
        console.log('LinkedIn job detected, waiting for content...');
        
        // Wait for key LinkedIn elements with longer timeout
        await Promise.race([
          page.waitForSelector('.jobs-description__content', { timeout: 8000 }),
          page.waitForSelector('.jobs-unified-top-card', { timeout: 8000 }),
          page.waitForSelector('.jobs-box__html-content', { timeout: 8000 })
        ]);

        // Try to expand the description
        await page.evaluate(() => {
          // Method 1: Click show more buttons
          document.querySelectorAll('button').forEach(button => {
            if (button.textContent?.toLowerCase().includes('show more') ||
                button.textContent?.toLowerCase().includes('see more')) {
              button.click();
            }
          });

          // Method 2: Force show all content
          document.querySelectorAll('.jobs-description__content, .jobs-box__html-content').forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.maxHeight = 'none';
              el.style.overflow = 'visible';
              // Remove any truncation classes
              el.classList.remove('truncated');
              el.classList.remove('collapsed');
            }
          });

          // Method 3: Remove any remaining collapse triggers
          document.querySelectorAll('[class*="truncate"], [class*="collapse"]').forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.maxHeight = 'none';
              el.style.overflow = 'visible';
            }
          });
        });

        // Wait a bit for content to expand
        await page.waitForTimeout(1500);

        // Clean up the page
        await page.evaluate(() => {
          // Remove unnecessary sections
          ['jobs-premium-upsell', 'similar-jobs', 'job-seeker-tools', 'jobs-company__footer'].forEach(className => {
            document.querySelectorAll(`[class*="${className}"]`).forEach(el => el.remove());
          });
        });
      }

      // Final check for content
      await page.waitForFunction(() => {
        const content = document.body.textContent || '';
        return content.length > 500;
      }, { timeout: 3000 });

    } catch (error) {
      console.log('Error waiting for content:', error);
      // Continue anyway, we might have enough content
    }

    console.log('Generating PDF...');
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true, // Enable backgrounds for better LinkedIn rendering
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      preferCSSPageSize: true,
      scale: 0.9
    });

    console.log('PDF generated successfully');
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=job.pdf'
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    const error = err as Error;
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: JSON.parse(event.body || '{}').url
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error.message,
        url: JSON.parse(event.body || '{}').url
      })
    };
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
};
