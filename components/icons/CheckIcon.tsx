import React from 'react';

const CheckIcon: React.FC<{ className?: string; 'aria-hidden'?: boolean }> = ({
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export default CheckIcon;
