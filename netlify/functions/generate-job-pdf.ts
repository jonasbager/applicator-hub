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
    
    // Allow scripts for LinkedIn to handle dynamic content
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      // Allow document, stylesheet, and script for LinkedIn
      if (resourceType === 'document' || resourceType === 'stylesheet' || 
          (url.includes('linkedin.com/jobs/view/') && resourceType === 'script')) {
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

      /* Show LinkedIn job description */
      .jobs-description__content {
        display: block !important;
        visibility: visible !important;
        height: auto !important;
        overflow: visible !important;
      }
    `;

    console.log('Setting user agent...');
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36');

    console.log('Navigating to URL...');
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle0', // Wait for network to be idle
        timeout: 15000 // Increased timeout for LinkedIn
      });
    } catch (error: any) {
      console.error('Navigation error:', error);
      throw new Error(`Failed to load page: ${error?.message || 'Unknown error'}`);
    }

    console.log('Waiting for main content...');
    try {
      // Wait for the main content to be available
      await page.waitForFunction(() => {
        const content = document.body.textContent || '';
        return content.length > 100; // Basic check that some content is loaded
      }, { timeout: 5000 });

      // For LinkedIn, wait for and click the "Show more" button
      if (url.includes('linkedin.com/jobs/view/')) {
        console.log('LinkedIn job detected, expanding description...');
        try {
          // Wait for the job description to load
          await page.waitForSelector('.jobs-description__content', { timeout: 5000 });

          // Try multiple ways to click "Show more" buttons
          await page.evaluate(() => {
            // Method 1: Click by button text
            document.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
              const text = button.textContent?.toLowerCase() || '';
              if (text.includes('show more') || text.includes('see more')) {
                button.click();
              }
            });

            // Method 2: Click by aria-label
            document.querySelectorAll<HTMLButtonElement>('button[aria-label*="Click to see more"]')
              .forEach(button => button.click());

            // Method 3: Click by class name patterns
            document.querySelectorAll<HTMLElement>('[class*="show-more"], [class*="expand"]')
              .forEach(el => el.click());

            // Method 4: Force expand any collapsed sections
            document.querySelectorAll<HTMLElement>('.jobs-description__content')
              .forEach(desc => {
                desc.style.maxHeight = 'none';
                desc.style.overflow = 'visible';
              });
          });

          // Wait for expanded content
          await page.waitForTimeout(2000);
        } catch (error) {
          console.log('No show more button found or error expanding:', error);
        }
      }

      // Check for job content
      await page.waitForFunction(() => {
        return document.querySelector('div:not(:empty), article:not(:empty), section:not(:empty)');
      }, { timeout: 5000 });
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

        // For LinkedIn, ensure the job description is fully visible
        if (window.location.href.includes('linkedin.com/jobs/view/')) {
          document.querySelectorAll<HTMLElement>('.jobs-description__content')
            .forEach(desc => {
              desc.style.maxHeight = 'none';
              desc.style.overflow = 'visible';
              desc.style.display = 'block';
              desc.style.visibility = 'visible';
              desc.style.opacity = '1';
            });
        }
      });

      // Wait for layout to stabilize
      await page.waitForTimeout(1000);
      
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
