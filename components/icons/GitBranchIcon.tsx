
import React from 'react';

export const GitBranchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v12c0 1.657 1.343 3 3 3h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9l-3-3 3-3" />
        <circle cx="6" cy="3" r="3" fill="currentColor" stroke="none" />
        <circle cx="18" cy="18" r="3" fill="currentColor" stroke="none" />
    </svg>
);
