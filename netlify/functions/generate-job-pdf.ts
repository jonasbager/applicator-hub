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
    
    // Block non-essential resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType === 'document' || resourceType === 'stylesheet') {
        request.continue();
      } else {
        request.abort();
      }
    });

    // CSS to show all content immediately
    const showAllContentStyle = `
      * {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        color: black !important;
      }

      /* Hide unnecessary elements */
      script, style, link, meta, iframe,
      [class*="cookie"], [class*="popup"], [class*="modal"], [class*="banner"],
      [class*="advertisement"], [class*="notification"], [class*="footer"],
      [class*="header"]:not([class*="job"]):not([class*="description"]),
      button:not([class*="show-more"]):not([class*="see-more"]) {
        display: none !important;
      }

      /* Basic layout */
      body {
        padding: 20px !important;
        margin: 0 auto !important;
        max-width: 800px !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }

      /* LinkedIn specific */
      .jobs-unified-top-card__job-title {
        font-size: 24px !important;
        font-weight: bold !important;
        margin-bottom: 8px !important;
      }

      .jobs-unified-top-card__company-name {
        font-size: 18px !important;
        margin-bottom: 16px !important;
      }

      .jobs-description__content {
        font-size: 16px !important;
        line-height: 1.5 !important;
      }
    `;

    // Inject the CSS before page load
    await page.setContent(`
      <style>${showAllContentStyle}</style>
      <script>
        // Override any content hiding
        Object.defineProperty(document, 'hidden', { value: false });
        Object.defineProperty(document, 'visibilityState', { value: 'visible' });
      </script>
    `);

    console.log('Navigating to URL...');
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 5000
    });

    // Add CSS again after load to ensure it takes effect
    await page.addStyleTag({ content: showAllContentStyle });

    // Short wait for any immediate content
    await page.waitForTimeout(500);

    console.log('Generating PDF...');
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true,
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
