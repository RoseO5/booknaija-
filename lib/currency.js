export const getCurrencies = () => ({
  NG: { code: 'NGN', symbol: '₦', name: 'Naira' },
  GH: { code: 'GHS', symbol: '₵', name: 'Cedi' },
  KE: { code: 'KES', symbol: 'KSh', name: 'Shilling' },
  ZA: { code: 'ZAR', symbol: 'R', name: 'Rand' },
  SN: { code: 'XOF', symbol: 'CFA', name: 'Franc' },
  // Add more in Phase 3
});

export const getDefaultCurrency = (countryCode = 'NG') => {
  const currencies = getCurrencies();
  return currencies[countryCode] || currencies.NG;
};
