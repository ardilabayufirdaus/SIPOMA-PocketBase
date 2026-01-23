import React from 'react';
import { Language } from '../types';
import FlagENIcon from './icons/FlagENIcon';
import FlagIDIcon from './icons/FlagIDIcon';
import { EnhancedButton } from './ui/EnhancedComponents';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="flex flex-col items-center space-y-3 mb-4">
      <EnhancedButton
        variant={currentLanguage === 'en' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onLanguageChange('en')}
        ariaLabel="Switch to English"
        disabled={currentLanguage === 'en'}
        className="p-1 w-10 h-10"
        icon={
          <div>
            <FlagENIcon className="w-6 h-auto rounded-md" />
          </div>
        }
      >
        <span className="sr-only">English</span>
      </EnhancedButton>
      <EnhancedButton
        variant={currentLanguage === 'id' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onLanguageChange('id')}
        ariaLabel="Switch to Indonesian"
        disabled={currentLanguage === 'id'}
        className="p-1 w-10 h-10"
        icon={
          <div>
            <FlagIDIcon className="w-6 h-auto rounded-md" />
          </div>
        }
      >
        <span className="sr-only">Indonesian</span>
      </EnhancedButton>
    </div>
  );
};
