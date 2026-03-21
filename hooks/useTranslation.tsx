import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLegacyTranslations } from '../utils/translationUtils';

export type Language = 'en' | 'id';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>; // Keep legacy format for backward compatibility
  isLoaded: boolean;
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

  const [t, setT] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sipoma-language', lang);
  };

  useEffect(() => {
    setIsLoaded(false);
    // Dynamic import to split chunks
    const loadTranslations = async () => {
      try {
        const module = await import(`../src/locales/${language}.ts`);
        setT(createLegacyTranslations(module.default));
        setIsLoaded(true);

        // Update document language attribute
        document.documentElement.lang = language;
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback or handle error
      }
    };

    loadTranslations();
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {isLoaded ? (
        children
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950 z-[9999]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}
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
