import React from 'react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`w-12 h-12 ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C98666" />
          <stop offset="50%" stopColor="#9C5940" />
          <stop offset="100%" stopColor="#7A3D26" />
        </linearGradient>
      </defs>
      
      {/* Outer and Inner circles */}
      <circle cx="50" cy="50" r="48" fill="transparent" stroke="url(#copperGradient)" strokeWidth="0.5" opacity="0.8" />
      <circle cx="50" cy="50" r="33" fill="transparent" stroke="url(#copperGradient)" strokeWidth="0.5" opacity="0.5" />
      
      {/* Stylized 'T' */}
      <path 
        d="M 28 35 L 60 35 C 65 35, 70 30, 72 25 C 72 38, 65 46, 55 46 L 53 46 L 53 72 C 50 71, 48 70, 45 72 L 45 46 L 28 46 Z" 
        fill="url(#copperGradient)" 
      />
      
      {/* Circular text paths */}
      <path id="textPathTop" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
      <path id="textPathBottom" d="M 85,50 A 35,35 0 0,1 15,50" fill="none" />
      
      {/* Text around */}
      <text fill="url(#copperGradient)" fontSize="6" fontWeight="300" letterSpacing="2">
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          BARBEARIA DO TONY
        </textPath>
      </text>
      <text fill="url(#copperGradient)" fontSize="5.5" fontWeight="300" letterSpacing="1.5">
        <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
          ORIGINAL COMO VOCÊ
        </textPath>
      </text>

      {/* Mustaches on left and right */}
      <path 
        d="M 12 50 Q 13 48 14 50 Q 15 51 16 50 Q 17 48 18 50 Q 16 52 14 52 Q 12 52 10 50 Q 11 48 12 50 Z" 
        fill="url(#copperGradient)" 
        opacity="0.8"
      />
      <path 
        d="M 82 50 Q 83 48 84 50 Q 85 51 86 50 Q 87 48 88 50 Q 86 52 84 52 Q 82 52 80 50 Q 81 48 82 50 Z" 
        fill="url(#copperGradient)" 
        opacity="0.8"
      />
    </svg>
  );
}
