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
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { url, jobId, userId } = JSON.parse(event.body);
    if (!url || !jobId || !userId) {
      throw new Error('Missing required parameters');
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    const filename = `${jobId}.pdf`;
    const storagePath = `jobs/${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('job-snapshots')
      .upload(storagePath, pdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('job-snapshots')
      .getPublicUrl(storagePath);

    const { error: updateError } = await supabase
      .from('job_snapshots')
      .update({ pdf_url: publicUrl })
      .eq('job_id', jobId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ pdf_url: publicUrl })
    };

  } catch (error) {
    console.error('Error:', error);
    if (browser) {
      await browser.close().catch(console.error);
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
