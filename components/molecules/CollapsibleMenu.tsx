import React, { useState, useEffect, useCallback, memo } from "react";
import { EnhancedButton } from "../ui/EnhancedComponents";
import ChevronDownIcon from "../icons/ChevronDownIcon";

interface CollapsibleMenuProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  pages: { key: string; icon: React.ReactNode }[];
  activeSubPage: string;
  onSelect: (pageKey: string) => void;
  t: any;
  isCollapsed?: boolean;
}

/**
 * Komponen molecule CollapsibleMenu untuk sidebar
 * Props:
 * - icon: ReactNode
 * - label: string
 * - isActive: boolean
 * - pages: array
 * - activeSubPage: string
 * - onSelect: (pageKey: string) => void
 * - t: object
 * - isCollapsed?: boolean
 */
const CollapsibleMenu: React.FC<CollapsibleMenuProps> = memo(
  ({
    icon,
    label,
    isActive,
    pages,
    activeSubPage,
    onSelect,
    t,
    isCollapsed = false,
  }) => {
    const [isOpen, setIsOpen] = useState(isActive && !isCollapsed);

    useEffect(() => {
      if (isCollapsed) {
        setIsOpen(false);
      } else if (isActive) {
        setIsOpen(true);
      }
    }, [isCollapsed, isActive]);

    const handleToggle = useCallback(() => {
      if (!isCollapsed) {
        setIsOpen((prev) => !prev);
      }
    }, [isCollapsed]);

    const handleSubItemClick = useCallback(
      (pageKey: string) => {
        onSelect(pageKey);
      },
      [onSelect]
    );

    return (
      <div className="space-y-1">
        <EnhancedButton
          variant={isActive ? "primary" : "ghost"}
          size="sm"
          onClick={handleToggle}
          ariaLabel={label}
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-between"
          } ${isActive ? "text-white bg-slate-700/50" : ""}`}
          icon={
            <div className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
              <div
                className={`transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-105"
                }`}
              >
                {icon}
              </div>
              {!isCollapsed && <span className="truncate">{label}</span>}
            </div>
          }
        >
          {!isCollapsed && (
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {label}
            </div>
          )}
        </EnhancedButton>

        {isOpen && !isCollapsed && (
          <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {pages.map((page) => (
              <EnhancedButton
                key={page.key}
                variant={activeSubPage === page.key ? "primary" : "ghost"}
                size="sm"
                onClick={() => handleSubItemClick(page.key)}
                className={`w-full justify-start ${
                  activeSubPage === page.key
                    ? "text-red-400 bg-red-500/10 border-l-2 border-red-400"
                    : "text-slate-300 hover:text-white"
                }`}
                icon={
                  <div
                    className={`transition-transform duration-200 ${
                      activeSubPage === page.key
                        ? "scale-110"
                        : "group-hover:scale-105"
                    }`}
                  >
                    {page.icon}
                  </div>
                }
              >
                <span>{t[page.key as keyof typeof t] || page.key}</span>
              </EnhancedButton>
            ))}
          </div>
        )}
      </div>
    );
  }
);

export default CollapsibleMenu;
