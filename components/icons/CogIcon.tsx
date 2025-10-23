import React from 'react';

interface IconProps {
  className?: string;
}

const CogIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15.75 0H1.5m1.5 0v1.5m1.5-1.5v-1.5m12 0v1.5m1.5-1.5v-1.5M12 4.5v-1.5m0 15v1.5m-3.75-12H6m12 0h-2.25m-6 6H9m6 0h-2.25"
    />
  </svg>
);

export default CogIcon;

