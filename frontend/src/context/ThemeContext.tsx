import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeSettings, SiteSettings, PaymentIntegration } from '../types';
import { api } from '../api/client';

interface ThemeContextType {
  theme: ThemeSettings | null;
  siteSettings: SiteSettings | null;
  payments: PaymentIntegration[];
  currency: string;
  setCurrency: (curr: string) => void;
  loading: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [payments, setPayments] = useState<PaymentIntegration[]>([]);
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('gumshop_currency') || 'USD';
  });
  const [loading, setLoading] = useState<boolean>(true);

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    localStorage.setItem('gumshop_currency', curr);
  };

  const fetchThemeAndSettings = async () => {
    try {
      const [t, s, p] = await Promise.all([
        api.getTheme(),
        api.getSettings(),
        api.getPayments(),
      ]);
      setTheme(t);
      setSiteSettings(s);
      setPayments(p);
      applyThemeVariables(t);
    } catch (err) {
      console.warn('Failed to load theme data from API, using fallback defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeVariables = (t: ThemeSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', t.primaryColor || '#0F1115');
    root.style.setProperty('--color-secondary', t.secondaryColor || '#1A1D24');
    root.style.setProperty('--color-accent', t.accentColor || '#6366F1');
    root.style.setProperty('--color-bg', t.backgroundColor || '#0A0C0F');
    root.style.setProperty('--color-surface', t.surfaceColor || '#14171F');
    root.style.setProperty('--color-text', t.textColor || '#F9FAFB');
    root.style.setProperty('--color-muted', t.mutedTextColor || '#9CA3AF');
    root.style.setProperty('--color-btn', t.buttonColor || '#6366F1');
    root.style.setProperty('--color-btn-text', t.buttonTextColor || '#FFFFFF');
    root.style.setProperty('--radius-btn', t.buttonRadius || '8px');
    root.style.setProperty('--radius-card', t.cardRadius || '12px');

    if (t.brandName) {
      document.title = `${t.brandName} | ${t.tagline || 'Premium Gear, Minimalist Living'}`;
    }
  };

  useEffect(() => {
    fetchThemeAndSettings();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        siteSettings,
        payments,
        currency,
        setCurrency,
        loading,
        refreshTheme: fetchThemeAndSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
