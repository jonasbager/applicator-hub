const LOGO_API_KEY = import.meta.env.VITE_LOGO_API_KEY;

export function getCompanyLogoUrl(company: string): string {
  // Extract domain from URL or use company name
  let domain = company.toLowerCase();
  
  // Remove protocol and www if present
  domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  // Remove anything after the first slash
  domain = domain.split('/')[0];
  
  // If it looks like a domain (contains a dot), use it directly
  // Otherwise, append .com as a fallback
  if (!domain.includes('.')) {
    domain = `${domain}.com`;
  }
  
  // Construct the logo.dev URL with the token parameter
  return `https://img.logo.dev/${domain}?token=${LOGO_API_KEY}&retina=true`;
}
