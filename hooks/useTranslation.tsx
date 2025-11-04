import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../translations';
import { createLegacyTranslations } from '../utils/translationUtils';

export type Language = 'en' | 'id';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>; // Keep legacy format for backward compatibility
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  defaultLanguage = 'en',
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage
    const saved = localStorage.getItem('sipoma-language');
    return saved === 'en' || saved === 'id' ? saved : defaultLanguage;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sipoma-language', lang);
  };

  const t = createLegacyTranslations(
    translations[language] as Record<string, string | { content: string; author: string }[]>
  );

  useEffect(() => {
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
