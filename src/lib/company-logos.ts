const LOGO_API_KEY = import.meta.env.VITE_LOGO_API_KEY;

export function getCompanyLogoUrl(url: string): string {
  try {
    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(fullUrl).hostname.replace('www.', '');
    return `https://img.logo.dev/${domain}?token=${LOGO_API_KEY}&retina=true`;
  } catch {
    return '';
  }
}
