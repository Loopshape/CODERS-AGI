
import React from 'react';

export const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 000-18M3.54 9H20.46M3.54 15H20.46M12 3c-2.76 0-5 4.03-5 9s2.24 9 5 9 5-4.03 5-9-2.24-9-5-9z" />
    </svg>
);
