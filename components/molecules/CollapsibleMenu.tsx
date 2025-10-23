import React, { useState, useEffect, useCallback, memo } from 'react';
import { EnhancedButton } from '../ui/EnhancedComponents';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import { designSystem } from '../../utils/designSystem';

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
  ({ icon, label, isActive, pages, activeSubPage, onSelect, t, isCollapsed = false }) => {
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
        <div
          style={
            isActive
              ? {
                  backgroundColor: designSystem.colors.primary[500] + '10',
                  color: designSystem.colors.primary[400],
                  border: `1px solid ${designSystem.colors.primary[500]}20`,
                  borderRadius: '0.375rem',
                }
              : {}
          }
        >
          <EnhancedButton
            variant={isActive ? 'primary' : 'ghost'}
            size="sm"
            onClick={handleToggle}
            ariaLabel={label}
            className={`w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            icon={
              <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
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
                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            )}
            {isCollapsed && (
              <div
                className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                style={{
                  backgroundColor: designSystem.colors.gray[800],
                  color: designSystem.colors.gray[50],
                }}
              >
                {label}
              </div>
            )}
          </EnhancedButton>
        </div>

        {isOpen && !isCollapsed && (
          <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {pages.map((page) => (
              <div
                key={page.key}
                style={
                  activeSubPage === page.key
                    ? {
                        color: designSystem.colors.primary[400],
                        backgroundColor: designSystem.colors.primary[500] + '10',
                        borderLeft: `2px solid ${designSystem.colors.primary[400]}`,
                        borderRadius: '0.25rem',
                      }
                    : {
                        color: designSystem.colors.gray[300],
                      }
                }
                className={activeSubPage !== page.key ? 'hover:text-white' : ''}
              >
                <EnhancedButton
                  variant={activeSubPage === page.key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleSubItemClick(page.key)}
                  className="w-full justify-start"
                  icon={
                    <div
                      className={`transition-transform duration-200 ${
                        activeSubPage === page.key ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                    >
                      {page.icon}
                    </div>
                  }
                >
                  <span>{t[page.key as keyof typeof t] || page.key}</span>
                </EnhancedButton>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
CollapsibleMenu.displayName = 'CollapsibleMenu';

export default CollapsibleMenu;


