import React from 'react'

interface Grid4x4IconProps {
  className?: string
  size?: number
}

export const Grid4x4Icon: React.FC<Grid4x4IconProps> = ({ 
  className = "", 
  size = 16 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 4x4 網格 - 每個格子大小約5x5，間距1 */}
      <rect x="2" y="2" width="4" height="4" />
      <rect x="8" y="2" width="4" height="4" />
      <rect x="14" y="2" width="4" height="4" />
      <rect x="20" y="2" width="2" height="4" />
      
      <rect x="2" y="8" width="4" height="4" />
      <rect x="8" y="8" width="4" height="4" />
      <rect x="14" y="8" width="4" height="4" />
      <rect x="20" y="8" width="2" height="4" />
      
      <rect x="2" y="14" width="4" height="4" />
      <rect x="8" y="14" width="4" height="4" />
      <rect x="14" y="14" width="4" height="4" />
      <rect x="20" y="14" width="2" height="4" />
      
      <rect x="2" y="20" width="4" height="2" />
      <rect x="8" y="20" width="4" height="2" />
      <rect x="14" y="20" width="4" height="2" />
      <rect x="20" y="20" width="2" height="2" />
    </svg>
  )
} 