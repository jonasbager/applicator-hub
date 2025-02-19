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
      // Only allow document and stylesheet resources
      if (resourceType === 'document' || resourceType === 'stylesheet') {
        request.continue();
      } else {
        request.abort();
      }
    });

    // Simplified CSS to minimize processing
    const hideElementsStyle = `
      /* Hide all non-essential elements */
      header, footer, nav, aside, iframe, form, button, 
      [role="banner"], [role="navigation"], [role="complementary"],
      [class*="cookie"], [class*="popup"], [class*="modal"], [class*="banner"],
      [class*="advertisement"], [class*="notification"] {
        display: none !important;
      }

      /* Clean layout */
      body {
        padding: 20px !important;
        margin: 0 !important;
        background: white !important;
        max-width: 800px !important;
        margin: 0 auto !important;
      }

      /* Ensure main content is visible */
      main, article, [role="main"],
      [class*="content"], [class*="job"], [class*="description"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
    `;

    console.log('Setting user agent...');
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36');

    console.log('Navigating to URL...');
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Use domcontentloaded instead of networkidle0 for faster loading
        timeout: 8000 // Reduced timeout
      });
    } catch (error: any) {
      console.error('Navigation error:', error);
      throw new Error(`Failed to load page: ${error?.message || 'Unknown error'}`);
    }

    console.log('Waiting for main content...');
    try {
      // Wait for the main content to be available with a shorter timeout
      await page.waitForFunction(() => {
        const content = document.body.textContent || '';
        return content.length > 100; // Basic check that some content is loaded
      }, { timeout: 3000 });

      // Quick check for any non-empty content
      await page.waitForFunction(() => {
        return document.querySelector('div:not(:empty), article:not(:empty), section:not(:empty)');
      }, { timeout: 3000 });
    } catch (error: any) {
      console.error('Content loading error:', error);
      throw new Error(`Failed to detect job posting content: ${error?.message || 'The page might be invalid or require authentication'}`);
    }

    console.log('Preparing page for PDF...');
    try {
      // Inject the CSS and wait for it to take effect
      await page.addStyleTag({ content: hideElementsStyle });
      
      // Clean up the page
      await page.evaluate(() => {
        // Remove tracking and ad-related scripts
        document.querySelectorAll('script[src*="analytics"], script[src*="tracking"], script[src*="ads"]')
          .forEach(el => el.remove());
        
        // Remove non-essential iframes
        document.querySelectorAll('iframe:not([class*="job"]):not([class*="description"])')
          .forEach(el => el.remove());
          
        // Remove hidden elements that might affect layout
        document.querySelectorAll('[aria-hidden="true"], [hidden], .hidden, .invisible')
          .forEach(el => el.remove());
      });

      // Minimal wait for layout
      await page.waitForTimeout(500);
      
      // Ensure the page is scrolled to top
      await page.evaluate(() => window.scrollTo(0, 0));
    } catch (error: any) {
      console.error('Page preparation error:', error);
      throw new Error(`Failed to prepare page for PDF generation: ${error?.message || 'Unknown error'}`);
    }

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
