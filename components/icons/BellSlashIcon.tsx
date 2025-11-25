import React from 'react';

const BellSlashIcon: React.FC<{
  className?: string;
  'aria-hidden'?: boolean;
}> = ({ className = 'w-6 h-6', 'aria-hidden': ariaHidden }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden={ariaHidden}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 4.5m-18 18L21 4.5m0 0h-3.75M21 4.5v3.75"
    />
  </svg>
);

export default BellSlashIcon;


