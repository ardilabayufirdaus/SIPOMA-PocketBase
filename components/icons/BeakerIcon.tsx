import React from 'react';

interface IconProps {
  className?: string;
}

const BeakerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
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
      d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 15.414A2.25 2.25 0 0 0 4.341 17c0 1.243 1.007 2.25 2.25 2.25h10.818c1.243 0 2.25-1.007 2.25-2.25 0-.597-.237-1.169-.659-1.591l-4.091-5.005a2.25 2.25 0 0 1-.659-1.591V3.104M9.75 3.104c-.621 0-1.125.504-1.125 1.125s.504 1.125 1.125 1.125h4.5c.621 0 1.125-.504 1.125-1.125s-.504-1.125-1.125-1.125M9.75 3.104h4.5M7.5 15h9"
    />
  </svg>
);

export default BeakerIcon;
