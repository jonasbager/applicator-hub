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

function getCompanyDomain(company: string): string {
  console.log('Getting domain for company:', company);
  
  // Common company domain mappings
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

  // Convert company name to lowercase for matching
  const companyLower = company.toLowerCase();

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

  // For other companies, try appending .com
  const domain = `${companyLower}.com`;
  console.log('Generated domain:', domain);
  return domain;
}

export function getCompanyLogoUrl(job: { company_url?: string; company: string }): string {
  console.log('Getting logo URL for job:', job);
  
  // Try to get domain from company_url first
  if (job.company_url) {
    console.log('Trying company_url:', job.company_url);
    const domain = extractDomain(job.company_url);
    if (domain) {
      console.log('Extracted domain from company_url:', domain);
      return `https://img.logo.dev/${domain}?token=${import.meta.env.VITE_LOGO_API_KEY}&retina=true`;
    }
  }

  // If no company_url, use company name to generate domain
  const domain = getCompanyDomain(job.company);
  const logoUrl = `https://img.logo.dev/${domain}?token=${import.meta.env.VITE_LOGO_API_KEY}&retina=true`;
  console.log('Generated logo URL:', logoUrl);
  return logoUrl;
}
