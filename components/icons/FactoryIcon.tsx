import React from 'react';

interface IconProps {
  className?: string;
}

const FactoryIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
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
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75v.75h-.75V6.75Zm.75 1.5h.75v.75h-.75V8.25Zm.75 1.5h.75v.75h-.75v-.75Zm.75 1.5h.75v.75h-.75v-.75Zm0-4.5h.75v.75h-.75v-.75Zm1.5 0h.75v.75h-.75v-.75Zm1.5 0h.75v.75h-.75v-.75Zm-3.75 13.5v-1.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v1.5m3-3v-1.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v1.5m-9-3.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v1.5"
    />
  </svg>
);

export default FactoryIcon;

