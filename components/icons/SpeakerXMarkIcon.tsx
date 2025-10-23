import React from 'react';

const SpeakerXMarkIcon: React.FC<{
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
      d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.78V9.97c0-.98.71-1.78 1.59-1.78h2.24z"
    />
  </svg>
);

export default SpeakerXMarkIcon;

