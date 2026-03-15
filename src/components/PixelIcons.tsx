// Pixel Art Icons for Veloz - Simplified, larger icons like the hourglass
// All icons use 20x20 grid for better visibility

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Play Icon - Simple right triangle
export const PlayIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="4" y="3" width="3" height="3" fill={color} />
    <rect x="7" y="3" width="3" height="3" fill={color} />
    <rect x="10" y="3" width="3" height="3" fill={color} />
    <rect x="4" y="6" width="3" height="3" fill={color} />
    <rect x="7" y="6" width="3" height="3" fill={color} />
    <rect x="10" y="6" width="3" height="3" fill={color} />
    <rect x="13" y="6" width="3" height="3" fill={color} />
    <rect x="4" y="9" width="3" height="3" fill={color} />
    <rect x="7" y="9" width="3" height="3" fill={color} />
    <rect x="10" y="9" width="3" height="3" fill={color} />
    <rect x="13" y="9" width="3" height="3" fill={color} />
    <rect x="4" y="12" width="3" height="3" fill={color} />
    <rect x="7" y="12" width="3" height="3" fill={color} />
    <rect x="10" y="12" width="3" height="3" fill={color} />
    <rect x="4" y="15" width="3" height="3" fill={color} />
    <rect x="7" y="15" width="3" height="3" fill={color} />
    <rect x="10" y="15" width="3" height="3" fill={color} />
  </svg>
);

// Pause Icon - Two thick bars
export const PauseIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="5" y="3" width="4" height="14" fill={color} />
    <rect x="11" y="3" width="4" height="14" fill={color} />
  </svg>
);

// Skip Back Icon - Bar + arrow
export const SkipBackIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Vertical bar */}
    <rect x="3" y="3" width="3" height="14" fill={color} />
    {/* Arrow */}
    <rect x="7" y="5" width="3" height="3" fill={color} />
    <rect x="10" y="7" width="3" height="3" fill={color} />
    <rect x="7" y="9" width="3" height="3" fill={color} />
    <rect x="10" y="11" width="3" height="3" fill={color} />
    <rect x="13" y="9" width="3" height="3" fill={color} />
  </svg>
);

// Prev Icon - Simple left arrow
export const PrevIcon: React.FC<IconProps> = ({ size = 28, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="5" y="8" width="4" height="4" fill={color} />
    <rect x="9" y="5" width="3" height="3" fill={color} />
    <rect x="9" y="12" width="3" height="3" fill={color} />
    <rect x="12" y="8" width="4" height="4" fill={color} />
    <rect x="7" y="6" width="3" height="3" fill={color} />
    <rect x="7" y="11" width="3" height="3" fill={color} />
  </svg>
);

// Next Icon - Simple right arrow
export const NextIcon: React.FC<IconProps> = ({ size = 28, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="11" y="8" width="4" height="4" fill={color} />
    <rect x="8" y="5" width="3" height="3" fill={color} />
    <rect x="8" y="12" width="3" height="3" fill={color} />
    <rect x="4" y="8" width="4" height="4" fill={color} />
    <rect x="10" y="6" width="3" height="3" fill={color} />
    <rect x="10" y="11" width="3" height="3" fill={color} />
  </svg>
);

// Settings Icon - Simple gear
export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Gear body */}
    <rect x="6" y="2" width="8" height="3" fill={color} />
    <rect x="2" y="6" width="3" height="8" fill={color} />
    <rect x="15" y="6" width="3" height="8" fill={color} />
    <rect x="6" y="15" width="8" height="3" fill={color} />
    {/* Corners */}
    <rect x="4" y="4" width="2" height="2" fill={color} />
    <rect x="14" y="4" width="2" height="2" fill={color} />
    <rect x="4" y="14" width="2" height="2" fill={color} />
    <rect x="14" y="14" width="2" height="2" fill={color} />
    {/* Center */}
    <rect x="7" y="7" width="6" height="6" fill={color} opacity="0.5" />
    <rect x="8" y="8" width="4" height="4" fill={color} />
  </svg>
);

// Edit Icon - Simple pencil
export const EditIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Pencil body */}
    <rect x="13" y="3" width="4" height="4" fill={color} />
    <rect x="10" y="6" width="4" height="4" fill={color} />
    <rect x="7" y="9" width="4" height="4" fill={color} />
    <rect x="4" y="12" width="4" height="4" fill={color} />
    {/* Tip */}
    <rect x="3" y="15" width="3" height="3" fill={color} />
    <rect x="6" y="14" width="2" height="2" fill={color} />
  </svg>
);

// Upload Icon - Arrow pointing up
export const UploadIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Arrow head */}
    <rect x="7" y="3" width="6" height="3" fill={color} />
    <rect x="5" y="5" width="3" height="3" fill={color} />
    <rect x="12" y="5" width="3" height="3" fill={color} />
    <rect x="3" y="7" width="3" height="3" fill={color} />
    <rect x="14" y="7" width="3" height="3" fill={color} />
    {/* Stem */}
    <rect x="8" y="8" width="4" height="9" fill={color} />
  </svg>
);

// Trash Icon - Simple bin
export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Lid */}
    <rect x="5" y="3" width="10" height="3" fill={color} />
    {/* Body */}
    <rect x="4" y="6" width="12" height="11" fill={color} />
    {/* Stripes */}
    <rect x="7" y="8" width="2" height="7" fill="currentColor" opacity="0.3" />
    <rect x="11" y="8" width="2" height="7" fill="currentColor" opacity="0.3" />
  </svg>
);

// Fullscreen Icon - Expand corners
export const FullscreenIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Top left */}
    <rect x="3" y="3" width="5" height="3" fill={color} />
    <rect x="3" y="6" width="3" height="3" fill={color} />
    {/* Top right */}
    <rect x="12" y="3" width="5" height="3" fill={color} />
    <rect x="14" y="6" width="3" height="3" fill={color} />
    {/* Bottom left */}
    <rect x="3" y="14" width="5" height="3" fill={color} />
    <rect x="3" y="11" width="3" height="3" fill={color} />
    {/* Bottom right */}
    <rect x="12" y="14" width="5" height="3" fill={color} />
    <rect x="14" y="11" width="3" height="3" fill={color} />
  </svg>
);

// Exit Fullscreen Icon - Contract arrows
export const ExitFullscreenIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Arrows pointing inwards */}
    <rect x="5" y="3" width="3" height="3" fill={color} />
    <rect x="3" y="5" width="3" height="3" fill={color} />
    <rect x="12" y="3" width="3" height="3" fill={color} />
    <rect x="14" y="5" width="3" height="3" fill={color} />
    <rect x="5" y="14" width="3" height="3" fill={color} />
    <rect x="3" y="12" width="3" height="3" fill={color} />
    <rect x="12" y="14" width="3" height="3" fill={color} />
    <rect x="14" y="12" width="3" height="3" fill={color} />
  </svg>
);

// Palette/Color Icon - Paint drop
export const PaletteIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Drop shape */}
    <rect x="8" y="3" width="4" height="3" fill={color} />
    <rect x="5" y="5" width="3" height="3" fill={color} />
    <rect x="12" y="5" width="3" height="3" fill={color} />
    <rect x="4" y="8" width="3" height="3" fill={color} />
    <rect x="13" y="8" width="3" height="3" fill={color} />
    <rect x="4" y="11" width="12" height="3" fill={color} />
    <rect x="6" y="14" width="8" height="3" fill={color} />
    <rect x="8" y="17" width="4" height="2" fill={color} />
  </svg>
);

// Plus Icon - Thick plus
export const PlusIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="7" y="3" width="6" height="3" fill={color} />
    <rect x="7" y="6" width="6" height="8" fill={color} />
    <rect x="7" y="14" width="6" height="3" fill={color} />
    <rect x="3" y="7" width="3" height="6" fill={color} />
    <rect x="14" y="7" width="3" height="6" fill={color} />
  </svg>
);

// Minus Icon - Thick minus
export const MinusIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="3" y="7" width="14" height="6" fill={color} />
  </svg>
);

// Close/X Icon - Clear X
export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="4" y="4" width="3" height="3" fill={color} />
    <rect x="7" y="7" width="3" height="3" fill={color} />
    <rect x="10" y="10" width="3" height="3" fill={color} />
    <rect x="13" y="13" width="3" height="3" fill={color} />
    <rect x="13" y="4" width="3" height="3" fill={color} />
    <rect x="10" y="7" width="3" height="3" fill={color} />
    <rect x="4" y="13" width="3" height="3" fill={color} />
    <rect x="7" y="10" width="3" height="3" fill={color} />
  </svg>
);

// Checkmark Icon
export const CheckIcon: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    <rect x="4" y="10" width="3" height="3" fill={color} />
    <rect x="7" y="12" width="3" height="3" fill={color} />
    <rect x="10" y="10" width="3" height="3" fill={color} />
    <rect x="13" y="7" width="3" height="3" fill={color} />
    <rect x="7" y="9" width="3" height="3" fill={color} />
    <rect x="10" y="6" width="3" height="3" fill={color} />
  </svg>
);

// Loading/Spinner Icon
export const SpinnerIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={`${className} animate-spin`} shapeRendering="crispEdges">
    <rect x="9" y="2" width="2" height="4" fill={color} />
    <rect x="13" y="4" width="2" height="2" fill={color} opacity="0.8" />
    <rect x="15" y="7" width="3" height="2" fill={color} opacity="0.6" />
    <rect x="15" y="11" width="2" height="2" fill={color} opacity="0.4" />
    <rect x="9" y="14" width="2" height="4" fill={color} opacity="0.3" />
    <rect x="5" y="14" width="2" height="2" fill={color} opacity="0.4" />
    <rect x="2" y="11" width="3" height="2" fill={color} opacity="0.6" />
    <rect x="2" y="7" width="2" height="2" fill={color} opacity="0.8" />
    <rect x="5" y="4" width="2" height="2" fill={color} opacity="0.9" />
  </svg>
);

// Clipboard Icon
export const ClipboardIcon: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} shapeRendering="crispEdges">
    {/* Board */}
    <rect x="4" y="4" width="12" height="14" fill="color" opacity="0.2" />
    <rect x="4" y="4" width="12" height="2" fill={color} />
    <rect x="4" y="4" width="2" height="14" fill={color} />
    <rect x="14" y="4" width="2" height="14" fill={color} />
    <rect x="4" y="16" width="12" height="2" fill={color} />
    {/* Clip */}
    <rect x="7" y="2" width="6" height="3" fill={color} />
    {/* Lines */}
    <rect x="6" y="7" width="8" height="2" fill={color} opacity="0.5" />
    <rect x="6" y="10" width="6" height="2" fill={color} opacity="0.5" />
    <rect x="6" y="13" width="7" height="2" fill={color} opacity="0.5" />
  </svg>
);
