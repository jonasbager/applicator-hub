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
    
    // Block unnecessary resources while keeping styling
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (
        resourceType === 'media' ||
        resourceType === 'websocket' ||
        request.url().includes('analytics') ||
        request.url().includes('tracking') ||
        request.url().includes('advertisement') ||
        request.url().includes('google-analytics') ||
        request.url().includes('doubleclick')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Inject CSS to hide only non-essential elements
    const hideElementsStyle = `
      /* Hide non-essential UI elements */
      nav:not([class*="job"]):not([class*="description"]), 
      iframe, 
      form,
      [role="banner"],
      [role="navigation"]:not([class*="job"]):not([class*="description"]),
      .cookie-banner,
      .notification-banner,
      .popup,
      div[class*="cookie"],
      div[class*="notification"],
      div[class*="popup"],
      div[class*="modal"],
      div[class*="dialog"],
      div[class*="advertisement"],
      div[class*="banner"]:not([class*="job"]):not([class*="description"]),
      button:not([class*="job"]):not([class*="apply"]) {
        display: none !important;
      }

      /* Ensure main content is visible and well-formatted */
      body {
        padding: 20px !important;
        margin: 0 !important;
        background: white !important;
      }

      /* Preserve job-related content styling */
      [class*="job"], 
      [class*="description"],
      [class*="requirements"],
      [class*="qualifications"],
      [class*="responsibilities"],
      [class*="about"],
      [class*="company"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;

    console.log('Setting user agent...');
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36');

    console.log('Navigating to URL...');
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', // Changed from networkidle0 to be faster
      timeout: 20000 // 20 second timeout
    });

    console.log('Waiting for main content...');
    // Wait for the main content to be available
    await page.waitForFunction(() => {
      const content = document.body.textContent || '';
      return content.length > 100; // Basic check that some content is loaded
    }, { timeout: 5000 });

    console.log('Generating PDF...');
    // Inject the CSS and wait for it to take effect
    await page.addStyleTag({ content: hideElementsStyle });
    await page.evaluate(() => {
      // Remove tracking and ad-related scripts
      document.querySelectorAll('script[src*="analytics"], script[src*="tracking"], script[src*="ads"]')
        .forEach(el => el.remove());
      
      // Remove non-essential iframes
      document.querySelectorAll('iframe:not([class*="job"]):not([class*="description"])')
        .forEach(el => el.remove());
    });

    // Wait a bit for styles to stabilize
    await page.waitForTimeout(1000);

    // Generate optimized PDF
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: false, // Disable background for smaller file size
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      preferCSSPageSize: true,
      omitBackground: true,
      scale: 0.9, // Slightly reduce content size to fit better
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
