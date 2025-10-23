import React from 'react';

const FlagIDIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={className}>
    <path fill="#e70011" d="M0 0h60v15H0z" />
    <path fill="#fff" d="M0 15h60v15H0z" />
  </svg>
);

export default FlagIDIcon;

