import { Handler } from '@netlify/functions';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  let browser;
  try {
    console.log('Function started');
    
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { url, jobId, userId } = JSON.parse(event.body);
    console.log('Request parameters:', { url, jobId, userId });
    
    if (!url || !jobId || !userId) {
      throw new Error('Missing required parameters');
    }

    console.log('Getting chromium path...');
    const executablePath = await chromium.executablePath();
    console.log('Chromium path:', executablePath);

    console.log('Launching browser...');
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });
    console.log('Browser launched successfully');

    console.log('Creating new page...');
    const page = await browser.newPage();
    console.log('Page created');

    console.log('Navigating to URL:', url);
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log('Page loaded');

    console.log('Generating PDF...');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated, size:', pdf.length);

    await browser.close();
    browser = undefined;
    console.log('Browser closed');

    console.log('Uploading to Supabase...');
    const filename = `${jobId}.pdf`;
    const storagePath = `jobs/${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('job-snapshots')
      .upload(storagePath, pdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    console.log('PDF uploaded successfully');

    console.log('Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('job-snapshots')
      .getPublicUrl(storagePath);

    console.log('Updating database...');
    const { error: updateError } = await supabase
      .from('job_snapshots')
      .update({ pdf_url: publicUrl })
      .eq('job_id', jobId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }
    console.log('Database updated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ pdf_url: publicUrl })
    };

  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed after error');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
