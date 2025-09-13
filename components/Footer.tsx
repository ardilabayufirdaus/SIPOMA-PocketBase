import React from "react";
import FlagENIcon from "./icons/FlagENIcon";
import FlagIDIcon from "./icons/FlagIDIcon";
import { Language } from "../App";

// Import Design System
import { designSystem } from "../utils/designSystem";

// Import Typography Components
import { Body, Link } from "./ui/Typography";

interface FooterProps {
  t: any;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const Footer: React.FC<FooterProps> = ({
  t,
  currentLanguage,
  onLanguageChange,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-center sm:text-left text-slate-500 dark:text-slate-400">
            &copy; {currentYear} {t.footer_copyright}
          </p>
          <div className="flex items-center justify-center space-x-6 mt-4 sm:mt-0">
            <a
              href="#"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            >
              {t.footer_terms}
            </a>
            <a
              href="#"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            >
              {t.footer_privacy}
            </a>
            <a
              href="#"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            >
              {t.footer_contact}
            </a>
            <div className="flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onLanguageChange("en")}
                className={`transition-opacity duration-200 ${
                  currentLanguage === "en"
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label="Switch to English"
              >
                <FlagENIcon className="w-6 h-auto rounded-sm" />
              </button>
              <button
                onClick={() => onLanguageChange("id")}
                className={`transition-opacity duration-200 ${
                  currentLanguage === "id"
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label="Switch to Indonesian"
              >
                <FlagIDIcon className="w-6 h-auto rounded-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
