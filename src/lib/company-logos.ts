export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  if (weeks > 0) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}

// Map of company names to their logo URLs
// This can be used as a fallback when Clearbit doesn't have a logo
export const companyLogos: Record<string, string> = {
  'Google': 'https://www.google.com/favicon.ico',
  'Microsoft': 'https://www.microsoft.com/favicon.ico',
  'Apple': 'https://www.apple.com/favicon.ico',
  'Amazon': 'https://www.amazon.com/favicon.ico',
  'Meta': 'https://www.meta.com/favicon.ico',
  'Netflix': 'https://www.netflix.com/favicon.ico',
  // Add more companies as needed
};
