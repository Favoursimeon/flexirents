import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Currency = 'USD' | 'GHS' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceUSD: number) => number;
  formatPrice: (priceUSD: number) => string;
  getAllCurrencyPrices: (priceUSD: number) => Array<{ currency: Currency; formatted: string }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Default exchange rates (fallback if database fetch fails)
const DEFAULT_EXCHANGE_RATES = {
  USD: 1,
  GHS: 12.5,
  EUR: 0.92,
  GBP: 0.79,
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred-currency');
    return (saved as Currency) || 'USD';
  });
  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number>>(DEFAULT_EXCHANGE_RATES);

  // Fetch exchange rates from database
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const { data, error } = await supabase
          .from('currency_rates')
          .select('currency_code, rate_to_usd');

        if (error) throw error;

        if (data) {
          const rates: Record<string, number> = {};
          data.forEach((rate) => {
            rates[rate.currency_code] = rate.rate_to_usd;
          });
          setExchangeRates(rates as Record<Currency, number>);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to default rates
      }
    };

    fetchExchangeRates();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('currency_rates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'currency_rates',
        },
        () => {
          fetchExchangeRates();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('preferred-currency', currency);
  }, [currency]);

  const convertPrice = (priceUSD: number): number => {
    return priceUSD * exchangeRates[currency];
  };

  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    GHS: '₵',
    EUR: '€',
    GBP: '£',
  };

  const formatPrice = (priceUSD: number): string => {
    const convertedPrice = convertPrice(priceUSD);
    const symbol = currencySymbols[currency];
    return `${symbol}${convertedPrice.toLocaleString()}`;
  };

  const getAllCurrencyPrices = (priceUSD: number) => {
    return Object.keys(exchangeRates).map((curr) => {
      const currencyKey = curr as Currency;
      const converted = priceUSD * exchangeRates[currencyKey];
      return {
        currency: currencyKey,
        formatted: `${currencySymbols[currencyKey]}${converted.toLocaleString()}`,
      };
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
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
