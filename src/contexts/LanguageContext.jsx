import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '../locales/translations';

// Available languages
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to 'fr'
    const saved = localStorage.getItem('preferredLanguage');
    return saved || 'fr';
  });

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
    // Set html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (langCode) => {
    if (LANGUAGES[langCode]) {
      setLanguage(langCode);
    }
  };

  // Translation function - gets nested translation by key path
  // Usage: t('homePage.title') returns the translation for that path
  const t = useCallback((key, fallback = key) => {
    const keys = key.split('.');
    let result = translations[language];

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Return fallback if key not found
        return fallback;
      }
    }

    return result;
  }, [language]);

  const value = {
    language,
    currentLanguage: LANGUAGES[language],
    changeLanguage,
    languages: LANGUAGES,
    t, // Translation function
    translations: translations[language] // Current language translations object
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
