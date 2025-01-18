const LOGO_API_KEY = import.meta.env.VITE_LOGO_API_KEY;

export function getCompanyLogoUrl(company: string): string {
  // If it's a URL, extract just the domain part
  if (company.includes('.')) {
    const domain = company.toLowerCase()
      .replace(/^https?:\/\//, '')  // Remove protocol
      .replace(/^www\./, '')        // Remove www
      .split('/')[0];               // Remove path
    return `https://img.logo.dev/${domain}?token=${LOGO_API_KEY}&retina=true`;
  }
  
  // If it's just a company name, return null to show the fallback
  return '';
}
