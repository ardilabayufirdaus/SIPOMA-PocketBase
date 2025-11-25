import React from 'react';

const XMarkIcon: React.FC<{ className?: string; 'aria-hidden'?: boolean }> = ({
  className = 'w-6 h-6',
  'aria-hidden': ariaHidden,
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden={ariaHidden}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default XMarkIcon;


