import React, { memo } from 'react';
import { EnhancedButton } from '../ui/EnhancedComponents';

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
      <EnhancedButton
        variant={isActive ? 'primary' : 'ghost'}
        size="sm"
        onClick={onClick}
        ariaLabel={label}
        className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} ${
          isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''
        }`}
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
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </EnhancedButton>
    );
  }
);
NavLink.displayName = 'NavLink';

export default NavLink;
