
import React from 'react';

interface IconProps {
    className?: string;
}

const PresentationChartLineIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12A2.25 2.25 0 0 0 20.25 14.25V3m-16.5 0h16.5M3.75 16.5h16.5M3.75 12h16.5m-16.5 0h16.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 21 3-3 3 3 3-3 3 3" />
    </svg>
);

export default PresentationChartLineIcon;
