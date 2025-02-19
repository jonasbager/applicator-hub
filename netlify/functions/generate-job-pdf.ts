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
    
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      // Only allow essential resources
      if (resourceType === 'document' || resourceType === 'stylesheet' || 
          (url.includes('linkedin.com/jobs/view/') && resourceType === 'script')) {
        request.continue();
      } else {
        request.abort();
      }
    });

    // Simplified CSS
    const hideElementsStyle = `
      /* Clean layout */
      body {
        padding: 20px !important;
        margin: 0 auto !important;
        background: white !important;
        max-width: 800px !important;
      }

      /* Hide non-essential elements */
      header, footer, nav, aside, iframe, form,
      [role="banner"], [role="navigation"], [role="complementary"],
      [class*="cookie"], [class*="popup"], [class*="modal"], [class*="banner"],
      [class*="advertisement"], [class*="notification"],
      button:not([class*="show-more"]):not([class*="see-more"]) {
        display: none !important;
      }

      /* Show job content */
      main, article, [role="main"],
      [class*="content"], [class*="job"], [class*="description"],
      .jobs-description__content {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-width: 100% !important;
        margin: 0 !important;
        height: auto !important;
        overflow: visible !important;
      }
    `;

    console.log('Setting user agent...');
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36');

    // Set a maximum navigation time
    const maxNavigationTime = 8000; // 8 seconds
    const navigationPromise = page.goto(url, { waitUntil: 'load' });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Navigation timeout')), maxNavigationTime)
    );

    console.log('Navigating to URL...');
    try {
      await Promise.race([navigationPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('Navigation error:', error);
      // Continue anyway, we might have enough content
    }

    // Add the CSS early
    await page.addStyleTag({ content: hideElementsStyle });

    console.log('Waiting for content...');
    try {
      // For LinkedIn, expand the description
      if (url.includes('linkedin.com/jobs/view/')) {
        try {
          // Wait for job content with a short timeout
          await page.waitForSelector('.jobs-description__content', { timeout: 3000 });

          // Click show more buttons and expand content
          await page.evaluate(() => {
            // Click all show more buttons
            document.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
              if (button.textContent?.toLowerCase().includes('show more') ||
                  button.textContent?.toLowerCase().includes('see more')) {
                button.click();
              }
            });

            // Force expand description
            document.querySelectorAll<HTMLElement>('.jobs-description__content').forEach(desc => {
              desc.style.maxHeight = 'none';
              desc.style.overflow = 'visible';
            });
          });

          // Short wait for content to expand
          await page.waitForTimeout(500);
        } catch (error) {
          console.log('No show more button found or error expanding:', error);
        }
      }

      // Wait for any content with a short timeout
      await Promise.race([
        page.waitForFunction(() => {
          return document.querySelector('div:not(:empty), article:not(:empty), section:not(:empty)');
        }, { timeout: 3000 }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    } catch (error: any) {
      console.error('Content loading error:', error);
      // Continue anyway, we might have enough content
    }

    console.log('Generating PDF...');
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: false,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      preferCSSPageSize: true,
      omitBackground: true,
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
