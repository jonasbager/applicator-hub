interface CompanyLogo {
  url: string;
  backgroundColor?: string;
}

const companyLogos: Record<string, CompanyLogo> = {
  'Meta': {
    url: 'https://www.meta.com/favicon.ico',
    backgroundColor: '#1877F2'
  },
  'Netflix': {
    url: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    backgroundColor: '#E50914'
  },
  'Microsoft': {
    url: 'https://www.microsoft.com/favicon.ico',
    backgroundColor: '#00A4EF'
  },
  'Apple': {
    url: 'https://www.apple.com/favicon.ico',
    backgroundColor: '#000000'
  },
  'Google': {
    url: 'https://www.google.com/favicon.ico',
    backgroundColor: '#4285F4'
  },
  'Amazon': {
    url: 'https://www.amazon.com/favicon.ico',
    backgroundColor: '#FF9900'
  },
  'Spotify': {
    url: 'https://www.spotify.com/favicon.ico',
    backgroundColor: '#1DB954'
  },
  'Twitter': {
    url: 'https://twitter.com/favicon.ico',
    backgroundColor: '#1DA1F2'
  },
  'LinkedIn': {
    url: 'https://www.linkedin.com/favicon.ico',
    backgroundColor: '#0A66C2'
  },
  'default': {
    url: '/placeholder.svg',
    backgroundColor: '#6366F1'
  }
};

export function getCompanyLogo(company: string): CompanyLogo {
  // Normalize company name
  const normalizedName = Object.keys(companyLogos).find(
    name => company.toLowerCase().includes(name.toLowerCase())
  );

  return companyLogos[normalizedName || 'default'];
}

export function getTimeAgo(date: string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}
