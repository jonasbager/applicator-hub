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
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });

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
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      preferCSSPageSize: true,
      omitBackground: true // Reduce PDF size
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
