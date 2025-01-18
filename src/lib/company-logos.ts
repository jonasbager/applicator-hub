const LOGO_API_KEY = import.meta.env.VITE_LOGO_API_KEY;

export function getCompanyLogoUrl(company: string): string {
  // Extract domain if the company name is a URL
  let domain = company.toLowerCase();
  if (domain.includes('www.')) {
    domain = domain.split('www.')[1];
  }
  if (domain.includes('https://')) {
    domain = domain.split('https://')[1];
  }
  if (domain.includes('/')) {
    domain = domain.split('/')[0];
  }
  
  // Construct the logo.dev URL with the token parameter
  return `https://img.logo.dev/${domain}?token=${LOGO_API_KEY}&retina=true`;
}
