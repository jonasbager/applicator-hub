// Make sure we have the API key
if (!import.meta.env.VITE_LOGO_API_KEY) {
  console.error('Logo API key is missing');
}

function extractDomain(url: string): string | null {
  try {
    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    return new URL(fullUrl).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function extractLinkedInCompanyUrl(url: string): string | null {
  try {
    // Extract company name from LinkedIn URL
    const match = url.match(/linkedin\.com\/company\/([^/]+)/);
    if (match) {
      const companySlug = match[1];
      // Try common TLDs in order
      const tlds = ['.com', '.io', '.co', '.org', '.net'];
      for (const tld of tlds) {
        const domain = `${companySlug}${tld}`;
        console.log('Trying LinkedIn company domain:', domain);
        return domain;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getCompanyDomain(company: string, jobUrl?: string): string {
  console.log('Getting domain for company:', company, 'jobUrl:', jobUrl);
  
  // Try to extract company domain from LinkedIn URL first
  if (jobUrl?.includes('linkedin.com')) {
    const linkedInDomain = extractLinkedInCompanyUrl(jobUrl);
    if (linkedInDomain) {
      console.log('Found LinkedIn company domain:', linkedInDomain);
      return linkedInDomain;
    }
  }

  // Common company domain mappings with multiple TLDs
  const knownDomains: Record<string, string> = {
    'trustpilot': 'trustpilot.com',
    'pleo': 'pleo.io',
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'apple': 'apple.com',
    'amazon': 'amazon.com',
    'meta': 'meta.com',
    'facebook': 'facebook.com',
    'linkedin': 'linkedin.com',
    'twitter': 'twitter.com',
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'uber': 'uber.com',
    'airbnb': 'airbnb.com'
  };

  // Convert company name to lowercase and clean it
  const companyLower = company.toLowerCase()
    .replace(/[^a-z0-9.-]/g, ''); // Remove special characters except dots and hyphens

  // Check if it's a known company
  if (knownDomains[companyLower]) {
    console.log('Found known domain:', knownDomains[companyLower]);
    return knownDomains[companyLower];
  }

  // If company name already includes a domain extension, use it directly
  if (companyLower.includes('.')) {
    console.log('Company name contains domain:', companyLower);
    return companyLower;
  }

  // Try common TLDs in order
  const tlds = ['.com', '.io', '.co', '.org', '.net'];
  for (const tld of tlds) {
    const domain = `${companyLower}${tld}`;
    console.log('Trying domain:', domain);
    return domain; // Return first attempt
  }

  // Fallback to .com
  const domain = `${companyLower}.com`;
  console.log('Falling back to .com domain:', domain);
  return domain;
}

export function getCompanyLogoUrl(job: { company_url?: string; company: string; url?: string }): string {
  console.log('Getting logo URL for job:', job);
  
  // Try to get domain from company_url first
  if (job.company_url) {
    console.log('Trying company_url:', job.company_url);
    // Check if company_url looks like an email domain (from scraping)
    if (!job.company_url.startsWith('http')) {
      console.log('Company URL appears to be an email domain:', job.company_url);
      return `https://img.logo.dev/${job.company_url}?token=${import.meta.env.VITE_LOGO_API_KEY}&retina=true`;
    }
    // Otherwise try to extract domain from URL
    const domain = extractDomain(job.company_url);
    if (domain) {
      console.log('Extracted domain from company_url:', domain);
      return `https://img.logo.dev/${domain}?token=${import.meta.env.VITE_LOGO_API_KEY}&retina=true`;
    }
  }

  // If no company_url, use company name and job URL to generate domain
  const domain = getCompanyDomain(job.company, job.url);
  const logoUrl = `https://img.logo.dev/${domain}?token=${import.meta.env.VITE_LOGO_API_KEY}&retina=true`;
  console.log('Generated logo URL:', logoUrl);
  return logoUrl;
}
