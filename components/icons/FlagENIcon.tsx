import React from 'react';

const FlagENIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={className}>
    <clipPath id="a">
      <path d="M0 0v30h60V0z" />
    </clipPath>
    <clipPath id="b">
      <path d="M30 15 60 0v30L30 15z" />
    </clipPath>
    <g clipPath="url(#a)">
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="m0 0 60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="m0 0 60 30m0-30L0 30" clipPath="url(#b)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

export default FlagENIcon;
