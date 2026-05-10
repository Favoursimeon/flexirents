import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

type Currency = 'USD' | 'GHS';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceUSD: number) => number;
  formatPrice: (priceUSD: number) => string;
  getAllCurrencyPrices: (priceUSD: number) => Array<{ currency: Currency; formatted: string }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  GHS: 12.5,
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred-currency');
    if (saved === 'USD' || saved === 'GHS') return saved;
    return 'GHS';
  });

  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number>>(DEFAULT_EXCHANGE_RATES);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const { data } = await api.get('/api/admin/currencies');
        if (data && Array.isArray(data)) {
          const rates: Record<string, number> = { USD: 1, GHS: 12.5 };
          data.forEach((item: { currency_code: string; rate_to_usd: number }) => {
            rates[item.currency_code] = item.rate_to_usd;
          });
          setExchangeRates(rates as Record<Currency, number>);
        }
      } catch (error) {
        // Use default rates if fetch fails
        setExchangeRates(DEFAULT_EXCHANGE_RATES);
      }
    };

    fetchExchangeRates();
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('preferred-currency', newCurrency);
  };

  const convertPrice = (priceUSD: number): number => {
    const rate = exchangeRates[currency] || 1;
    return priceUSD * rate;
  };

  const formatPrice = (priceUSD: number): string => {
    const converted = convertPrice(priceUSD);
    if (currency === 'GHS') {
      return `₵${converted.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAllCurrencyPrices = (priceUSD: number) => {
    return (['USD', 'GHS'] as Currency[]).map((cur) => {
      const rate = exchangeRates[cur] || 1;
      const converted = priceUSD * rate;
      const formatted = cur === 'GHS'
        ? `₵${converted.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return { currency: cur, formatted };
    });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, getAllCurrencyPrices }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};

export default CurrencyContext;