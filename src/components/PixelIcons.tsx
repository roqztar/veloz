// Pixel Art Icons for Veloz
// All icons are 16x16 grid rendered at 20px or 24px

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Play Icon - Right pointing triangle
export const PlayIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="2" y="2" width="2" height="2" fill={color} />
    <rect x="4" y="2" width="2" height="2" fill={color} />
    <rect x="6" y="2" width="2" height="2" fill={color} />
    <rect x="2" y="4" width="2" height="2" fill={color} />
    <rect x="4" y="4" width="2" height="2" fill={color} />
    <rect x="6" y="4" width="2" height="2" fill={color} />
    <rect x="8" y="4" width="2" height="2" fill={color} />
    <rect x="2" y="6" width="2" height="2" fill={color} />
    <rect x="4" y="6" width="2" height="2" fill={color} />
    <rect x="6" y="6" width="2" height="2" fill={color} />
    <rect x="8" y="6" width="2" height="2" fill={color} />
    <rect x="10" y="6" width="2" height="2" fill={color} />
    <rect x="2" y="8" width="2" height="2" fill={color} />
    <rect x="4" y="8" width="2" height="2" fill={color} />
    <rect x="6" y="8" width="2" height="2" fill={color} />
    <rect x="8" y="8" width="2" height="2" fill={color} />
    <rect x="2" y="10" width="2" height="2" fill={color} />
    <rect x="4" y="10" width="2" height="2" fill={color} />
    <rect x="6" y="10" width="2" height="2" fill={color} />
    <rect x="2" y="12" width="2" height="2" fill={color} />
    <rect x="4" y="12" width="2" height="2" fill={color} />
  </svg>
);

// Pause Icon - Two bars
export const PauseIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="4" y="3" width="3" height="10" fill={color} />
    <rect x="9" y="3" width="3" height="10" fill={color} />
  </svg>
);

// Stop/Skip Back Icon - Double left arrows
export const SkipBackIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="2" y="2" width="2" height="12" fill={color} />
    <rect x="4" y="4" width="2" height="2" fill={color} />
    <rect x="6" y="6" width="2" height="2" fill={color} />
    <rect x="4" y="8" width="2" height="2" fill={color} />
    <rect x="6" y="10" width="2" height="2" fill={color} />
    <rect x="8" y="2" width="2" height="12" fill={color} />
    <rect x="10" y="4" width="2" height="2" fill={color} />
    <rect x="12" y="6" width="2" height="2" fill={color} />
    <rect x="10" y="8" width="2" height="2" fill={color} />
    <rect x="12" y="10" width="2" height="2" fill={color} />
  </svg>
);

// Prev Icon - Single left arrow
export const PrevIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="2" y="7" width="4" height="2" fill={color} />
    <rect x="4" y="5" width="2" height="2" fill={color} />
    <rect x="4" y="9" width="2" height="2" fill={color} />
    <rect x="6" y="3" width="2" height="2" fill={color} />
    <rect x="6" y="11" width="2" height="2" fill={color} />
    <rect x="6" y="7" width="4" height="2" fill={color} />
    <rect x="10" y="7" width="4" height="2" fill={color} />
  </svg>
);

// Next Icon - Single right arrow
export const NextIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="10" y="7" width="4" height="2" fill={color} />
    <rect x="10" y="5" width="2" height="2" fill={color} />
    <rect x="10" y="9" width="2" height="2" fill={color} />
    <rect x="8" y="3" width="2" height="2" fill={color} />
    <rect x="8" y="11" width="2" height="2" fill={color} />
    <rect x="6" y="7" width="4" height="2" fill={color} />
    <rect x="2" y="7" width="4" height="2" fill={color} />
  </svg>
);

// Settings Icon - Gear
export const SettingsIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Outer gear teeth */}
    <rect x="6" y="1" width="4" height="2" fill={color} />
    <rect x="6" y="13" width="4" height="2" fill={color} />
    <rect x="1" y="6" width="2" height="4" fill={color} />
    <rect x="13" y="6" width="2" height="4" fill={color} />
    <rect x="2" y="3" width="2" height="2" fill={color} />
    <rect x="12" y="3" width="2" height="2" fill={color} />
    <rect x="2" y="11" width="2" height="2" fill={color} />
    <rect x="12" y="11" width="2" height="2" fill={color} />
    <rect x="3" y="2" width="2" height="2" fill={color} />
    <rect x="11" y="2" width="2" height="2" fill={color} />
    <rect x="3" y="12" width="2" height="2" fill={color} />
    <rect x="11" y="12" width="2" height="2" fill={color} />
    {/* Inner gear */}
    <rect x="4" y="4" width="8" height="8" fill={color} opacity="0.5" />
    <rect x="6" y="6" width="4" height="4" fill={color} />
  </svg>
);

// Edit/Write Icon - Pencil
export const EditIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="10" y="2" width="2" height="2" fill={color} />
    <rect x="12" y="2" width="2" height="2" fill={color} />
    <rect x="8" y="4" width="2" height="2" fill={color} />
    <rect x="10" y="4" width="2" height="2" fill={color} />
    <rect x="6" y="6" width="2" height="2" fill={color} />
    <rect x="8" y="6" width="2" height="2" fill={color} />
    <rect x="4" y="8" width="2" height="2" fill={color} />
    <rect x="6" y="8" width="2" height="2" fill={color} />
    <rect x="2" y="10" width="2" height="2" fill={color} />
    <rect x="4" y="10" width="2" height="2" fill={color} />
    <rect x="2" y="12" width="4" height="2" fill={color} />
    <rect x="4" y="12" width="2" height="2" fill={color} />
  </svg>
);

// Upload Icon - Arrow up
export const UploadIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="6" y="2" width="4" height="2" fill={color} />
    <rect x="4" y="4" width="2" height="2" fill={color} />
    <rect x="6" y="4" width="4" height="2" fill={color} />
    <rect x="10" y="4" width="2" height="2" fill={color} />
    <rect x="2" y="6" width="2" height="2" fill={color} />
    <rect x="4" y="6" width="2" height="2" fill={color} />
    <rect x="6" y="6" width="4" height="2" fill={color} />
    <rect x="10" y="6" width="2" height="2" fill={color} />
    <rect x="12" y="6" width="2" height="2" fill={color} />
    <rect x="6" y="8" width="4" height="2" fill={color} />
    <rect x="6" y="10" width="4" height="2" fill={color} />
    <rect x="6" y="12" width="4" height="2" fill={color} />
  </svg>
);

// Delete/Trash Icon
export const TrashIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="5" y="2" width="6" height="2" fill={color} />
    <rect x="3" y="4" width="10" height="2" fill={color} />
    <rect x="4" y="6" width="2" height="8" fill={color} />
    <rect x="7" y="6" width="2" height="8" fill={color} />
    <rect x="10" y="6" width="2" height="8" fill={color} />
  </svg>
);

// Fullscreen Icon - Expand
export const FullscreenIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Top-left corner */}
    <rect x="2" y="2" width="4" height="2" fill={color} />
    <rect x="2" y="4" width="2" height="2" fill={color} />
    {/* Top-right corner */}
    <rect x="10" y="2" width="4" height="2" fill={color} />
    <rect x="12" y="4" width="2" height="2" fill={color} />
    {/* Bottom-left corner */}
    <rect x="2" y="12" width="4" height="2" fill={color} />
    <rect x="2" y="10" width="2" height="2" fill={color} />
    {/* Bottom-right corner */}
    <rect x="10" y="12" width="4" height="2" fill={color} />
    <rect x="12" y="10" width="2" height="2" fill={color} />
  </svg>
);

// Exit Fullscreen Icon - Contract
export const ExitFullscreenIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Top-left arrows in */}
    <rect x="4" y="2" width="2" height="2" fill={color} />
    <rect x="2" y="4" width="2" height="2" fill={color} />
    <rect x="2" y="2" width="2" height="2" fill={color} opacity="0.5" />
    {/* Top-right arrows in */}
    <rect x="10" y="2" width="2" height="2" fill={color} />
    <rect x="12" y="4" width="2" height="2" fill={color} />
    <rect x="12" y="2" width="2" height="2" fill={color} opacity="0.5" />
    {/* Bottom-left arrows in */}
    <rect x="4" y="12" width="2" height="2" fill={color} />
    <rect x="2" y="10" width="2" height="2" fill={color} />
    <rect x="2" y="12" width="2" height="2" fill={color} opacity="0.5" />
    {/* Bottom-right arrows in */}
    <rect x="10" y="12" width="2" height="2" fill={color} />
    <rect x="12" y="10" width="2" height="2" fill={color} />
    <rect x="12" y="12" width="2" height="2" fill={color} opacity="0.5" />
  </svg>
);

// Palette/Color Icon
export const PaletteIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Outer circle */}
    <rect x="5" y="2" width="6" height="2" fill={color} />
    <rect x="3" y="4" width="2" height="2" fill={color} />
    <rect x="11" y="4" width="2" height="2" fill={color} />
    <rect x="2" y="6" width="2" height="4" fill={color} />
    <rect x="12" y="6" width="2" height="4" fill={color} />
    <rect x="3" y="10" width="2" height="2" fill={color} />
    <rect x="11" y="10" width="2" height="2" fill={color} />
    <rect x="5" y="12" width="6" height="2" fill={color} />
    {/* Inner color drops */}
    <rect x="6" y="5" width="2" height="2" fill={color} opacity="0.7" />
    <rect x="8" y="5" width="2" height="2" fill={color} opacity="0.5" />
    <rect x="6" y="7" width="2" height="2" fill={color} opacity="0.5" />
    <rect x="8" y="7" width="2" height="2" fill={color} opacity="0.7" />
  </svg>
);

// Plus Icon
export const PlusIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="6" y="2" width="4" height="2" fill={color} />
    <rect x="6" y="12" width="4" height="2" fill={color} />
    <rect x="6" y="4" width="4" height="8" fill={color} />
    <rect x="2" y="6" width="2" height="4" fill={color} />
    <rect x="12" y="6" width="2" height="4" fill={color} />
  </svg>
);

// Minus Icon
export const MinusIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="2" y="6" width="12" height="4" fill={color} />
  </svg>
);

// Close/X Icon
export const CloseIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="3" y="3" width="2" height="2" fill={color} />
    <rect x="5" y="5" width="2" height="2" fill={color} />
    <rect x="7" y="7" width="2" height="2" fill={color} />
    <rect x="9" y="5" width="2" height="2" fill={color} />
    <rect x="11" y="3" width="2" height="2" fill={color} />
    <rect x="3" y="11" width="2" height="2" fill={color} />
    <rect x="5" y="9" width="2" height="2" fill={color} />
    <rect x="9" y="9" width="2" height="2" fill={color} />
    <rect x="11" y="11" width="2" height="2" fill={color} />
  </svg>
);

// Checkmark Icon
export const CheckIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    <rect x="3" y="8" width="2" height="2" fill={color} />
    <rect x="5" y="10" width="2" height="2" fill={color} />
    <rect x="7" y="8" width="2" height="2" fill={color} />
    <rect x="9" y="6" width="2" height="2" fill={color} />
    <rect x="11" y="4" width="2" height="2" fill={color} />
    <rect x="5" y="8" width="2" height="2" fill={color} />
    <rect x="7" y="6" width="2" height="2" fill={color} />
    <rect x="9" y="4" width="2" height="2" fill={color} />
  </svg>
);

// Loading/Spinner Icon
export const SpinnerIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`${className} animate-spin`} shapeRendering="crispEdges">
    <rect x="7" y="1" width="2" height="3" fill={color} />
    <rect x="11" y="3" width="2" height="2" fill={color} opacity="0.8" />
    <rect x="12" y="7" width="3" height="2" fill={color} opacity="0.6" />
    <rect x="11" y="11" width="2" height="2" fill={color} opacity="0.4" />
    <rect x="7" y="12" width="2" height="3" fill={color} opacity="0.3" />
    <rect x="3" y="11" width="2" height="2" fill={color} opacity="0.4" />
    <rect x="1" y="7" width="3" height="2" fill={color} opacity="0.6" />
    <rect x="3" y="3" width="2" height="2" fill={color} opacity="0.8" />
  </svg>
);

// Clipboard Icon
export const ClipboardIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Clipboard board */}
    <rect x="3" y="3" width="10" height="10" fill="none" stroke={color} strokeWidth="2" />
    {/* Top clip */}
    <rect x="6" y="1" width="4" height="2" fill={color} />
    <rect x="5" y="2" width="6" height="1" fill={color} opacity="0.5" />
    {/* Lines on paper */}
    <rect x="5" y="6" width="6" height="1" fill={color} opacity="0.5" />
    <rect x="5" y="8" width="4" height="1" fill={color} opacity="0.5" />
    <rect x="5" y="10" width="5" height="1" fill={color} opacity="0.5" />
  </svg>
);
