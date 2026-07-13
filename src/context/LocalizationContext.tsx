import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Currency = 'USD' | 'ZAR';

export interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  currencySymbol: string;
  features: string[];
}

interface LocalizationContextType {
  currency: Currency;
  currencySymbol: string;
  formatPrice: (price: number) => string;
  isSouthAfrican: boolean;
  billingCycle: 'monthly' | 'annual';
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  pricingTiers: PricingTier[];
}

const USD_PRICING: PricingTier[] = [
  {
    name: 'Creator Free',
    monthlyPrice: 0,
    annualPrice: 0,
    currencySymbol: '$',
    features: [
      '5 generations per month',
      '720p video output',
      'Community support',
      'Basic templates',
    ],
  },
  {
    name: 'Production Pro',
    monthlyPrice: 29,
    annualPrice: 290,
    currencySymbol: '$',
    features: [
      '50 generations per month',
      '1080p video output',
      'Priority support',
      'Advanced templates',
      'Custom aspect ratios',
      'Audio integration',
    ],
  },
  {
    name: 'Universal Studio',
    monthlyPrice: 99,
    annualPrice: 990,
    currencySymbol: '$',
    features: [
      'Unlimited generations',
      '4K video output',
      '24/7 dedicated support',
      'All premium templates',
      'API access',
      'White-label options',
      'Team collaboration',
    ],
  },
];

const ZAR_PRICING: PricingTier[] = [
  {
    name: 'Creator Free',
    monthlyPrice: 0,
    annualPrice: 0,
    currencySymbol: 'R',
    features: [
      '5 generations per month',
      '720p video output',
      'Community support',
      'Basic templates',
    ],
  },
  {
    name: 'Production Pro',
    monthlyPrice: 530,
    annualPrice: 5300,
    currencySymbol: 'R',
    features: [
      '50 generations per month',
      '1080p video output',
      'Priority support',
      'Advanced templates',
      'Custom aspect ratios',
      'Audio integration',
    ],
  },
  {
    name: 'Universal Studio',
    monthlyPrice: 1800,
    annualPrice: 18000,
    currencySymbol: 'R',
    features: [
      'Unlimited generations',
      '4K video output',
      '24/7 dedicated support',
      'All premium templates',
      'API access',
      'White-label options',
      'Team collaboration',
    ],
  },
];

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

function detectSouthAfrica(): boolean {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  const southAfricanTimezones = [
    'Africa/Johannesburg',
    'Africa/Cape_Town',
    'Africa/Durban',
    'Africa/Pretoria',
  ];

  if (southAfricanTimezones.includes(timezone)) {
    return true;
  }

  if (locale.toLowerCase().includes('za') || locale.toLowerCase().includes('af')) {
    return true;
  }

  return false;
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    const isSA = detectSouthAfrica();
    setCurrency(isSA ? 'ZAR' : 'USD');
  }, []);

  const isSouthAfrican = currency === 'ZAR';
  const currencySymbol = isSouthAfrican ? 'R' : '$';
  const pricingTiers = isSouthAfrican ? ZAR_PRICING : USD_PRICING;

  const formatPrice = useCallback(
    (price: number): string => {
      if (price === 0) return 'Free';
      return `${currencySymbol}${price}`;
    },
    [currencySymbol]
  );

  return (
    <LocalizationContext.Provider
      value={{
        currency,
        currencySymbol,
        formatPrice,
        isSouthAfrican,
        billingCycle,
        setBillingCycle,
        pricingTiers,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}
