interface CompanyColor {
  background: string;
  text: string;
  accent: string;
}

const companyColors: Record<string, CompanyColor> = {
  'Apple': {
    background: 'bg-gray-100',
    text: 'text-gray-900',
    accent: 'text-gray-600'
  },
  'Google': {
    background: 'bg-green-50',
    text: 'text-green-900',
    accent: 'text-green-600'
  },
  'Meta': {
    background: 'bg-blue-50',
    text: 'text-blue-900',
    accent: 'text-blue-600'
  },
  'Amazon': {
    background: 'bg-orange-50',
    text: 'text-orange-900',
    accent: 'text-orange-600'
  },
  'Microsoft': {
    background: 'bg-blue-50',
    text: 'text-blue-900',
    accent: 'text-blue-600'
  },
  'Twitter': {
    background: 'bg-sky-50',
    text: 'text-sky-900',
    accent: 'text-sky-600'
  },
  'LinkedIn': {
    background: 'bg-blue-50',
    text: 'text-blue-900',
    accent: 'text-blue-600'
  },
  'Airbnb': {
    background: 'bg-pink-50',
    text: 'text-pink-900',
    accent: 'text-pink-600'
  },
  'Uber': {
    background: 'bg-gray-100',
    text: 'text-gray-900',
    accent: 'text-gray-600'
  },
  'Netflix': {
    background: 'bg-red-50',
    text: 'text-red-900',
    accent: 'text-red-600'
  },
  'Spotify': {
    background: 'bg-green-50',
    text: 'text-green-900',
    accent: 'text-green-600'
  },
  'default': {
    background: 'bg-violet-50',
    text: 'text-violet-900',
    accent: 'text-violet-600'
  }
};

export function getCompanyColors(company: string): CompanyColor {
  // Normalize company name
  const normalizedName = Object.keys(companyColors).find(
    name => company.toLowerCase().includes(name.toLowerCase())
  );

  return companyColors[normalizedName || 'default'];
}
