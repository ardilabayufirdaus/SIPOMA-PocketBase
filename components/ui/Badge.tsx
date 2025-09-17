import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => (
  <span
    className={`inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold ${className}`}
  >
    {children}
  </span>
);

export default Badge;
