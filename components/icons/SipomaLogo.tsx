import React from 'react';

const SipomaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="40" height="40" rx="8" fill="#DC2626" />
    <path d="M12 29V11L20 16.5V29" fill="white" fillOpacity="0.5" />
    <path d="M20 29V16.5L28 11V29" fill="white" />
  </svg>
);

export default SipomaLogo;
