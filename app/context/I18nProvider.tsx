'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import {
  getTranslation,
  translations,
  DEFAULT_LANGUAGE,
  type LanguageCode,
  type TranslationKey,
} from '@/app/i18n/translations';

const STORAGE_KEY = 'potal_language';

export interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Load language from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
      if (savedLanguage) {
        // Validate it's a supported language
        if (savedLanguage in translations) {
          setLanguageState(savedLanguage as LanguageCode);
        }
      } else if (typeof navigator !== 'undefined' && navigator.language) {
        // CW29 Sprint 7: auto-detect browser language on first visit.
        // Falls back to DEFAULT_LANGUAGE (en) when navigator.language isn't
        // in our translation catalog.
        const primary = navigator.language.split('-')[0].toLowerCase();
        if (primary in translations) {
          setLanguageState(primary as LanguageCode);
        }
      }
    } catch (e) {
      console.error('I18n: Failed to load language preference', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for changing language
  const setLanguage = useCallback((newLanguage: LanguageCode) => {
    try {
      setLanguageState(newLanguage);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, newLanguage);
      }
    } catch (e) {
      console.error('I18n: Failed to save language preference', e);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      const translations = getTranslation(language);
      const value = translations[key];
      if (!value) {
        console.warn(`I18n: Missing translation for key "${key}"`);
        return key;
      }
      return value;
    },
    [language]
  );

  const value: I18nContextValue = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
