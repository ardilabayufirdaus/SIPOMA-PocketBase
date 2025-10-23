import React from 'react';

interface IconProps {
  className?: string;
}

const ScaleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
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
      d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v1.666c0 .414-.168.79-.44 1.062a4.006 4.006 0 0 1-2.83 1.182H7.44a4.006 4.006 0 0 1-2.83-1.182.75.75 0 0 1-.44-1.062v-1.666c0-.414.168-.79.44-1.062a4.006 4.006 0 0 1 2.83-1.182h7.12a4.006 4.006 0 0 1 2.83 1.182c.272.272.44.648.44 1.062m-13.5 0c-1.01.143-2.01.317-3 .52m3-.52v1.666c0 .414.168.79.44 1.062a4.006 4.006 0 0 0 2.83 1.182h7.12a4.006 4.006 0 0 0 2.83-1.182c.272.272.44.648.44 1.062M5.25 4.97V3.545A2.25 2.25 0 0 1 7.5 1.295h9A2.25 2.25 0 0 1 18.75 3.545v1.425"
    />
  </svg>
);

export default ScaleIcon;

