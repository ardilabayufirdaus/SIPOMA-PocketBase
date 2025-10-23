import React, { memo } from 'react';
import { EnhancedButton } from '../ui/EnhancedComponents';
import { designSystem } from '../../utils/designSystem';

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}

/**
 * Komponen atomik NavLink untuk navigasi sidebar
 * Props:
 * - icon: ReactNode
 * - label: string
 * - isActive: boolean
 * - onClick: () => void
 * - isCollapsed?: boolean
 */
const NavLink: React.FC<NavLinkProps> = memo(
  ({ icon, label, isActive, onClick, isCollapsed = false }) => {
    return (
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
          onClick={onClick}
          ariaLabel={label}
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          icon={
            <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
              <div
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-105' : 'group-hover:scale-105'
                }`}
              >
                {icon}
              </div>
              {!isCollapsed && <span className="truncate">{label}</span>}
            </div>
          }
        >
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
    );
  }
);
NavLink.displayName = 'NavLink';

export default NavLink;

