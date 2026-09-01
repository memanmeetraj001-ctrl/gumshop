export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.78 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.35 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', rate: 1.52 },
  { code: 'INR', symbol: 'Rs.', name: 'Indian Rupee', rate: 83.5 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 155.0 },
];

export const formatPrice = (price: number, targetCurrency = 'USD'): string => {
  const curr = CURRENCIES.find((c) => c.code === targetCurrency) || CURRENCIES[0];
  const converted = price * curr.rate;

  if (targetCurrency === 'JPY') {
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (text: string, maxLength = 120): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};
