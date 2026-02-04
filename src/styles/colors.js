/**
 * Design System Color Constants
 * 
 * Import these constants in React components instead of using hardcoded hex values.
 * This ensures consistency with the Trust Blue design system and makes theme changes easier.
 * 
 * Usage:
 * import { COLORS } from '@/styles/colors';
 * <div style={{ color: COLORS.primary }}>Text</div>
 */

export const COLORS = {
  // Primary Brand Colors
  primary: '#0043ce',           // Trust Blue - main brand color
  primaryDark: '#001d6c',       // Deep Blue - headers, navigation
  primaryLight: '#a6c8ff',      // Sky Blue - highlights, backgrounds
  primaryLighter: '#e3edfd',    // Very light blue - subtle backgrounds
  
  // Secondary Colors
  secondary: '#007d79',         // Teal - data visualization, secondary actions
  
  // Semantic Colors
  success: '#198038',           // Green - success states, compliant status
  successLight: '#def2d7',      // Light green - success backgrounds
  warning: '#ff832b',           // Amber - warnings, attention needed
  warningLight: '#f7f3d7',      // Light amber - warning backgrounds
  error: '#da1e28',             // Red - errors, critical issues
  errorLight: '#ecc8c5',        // Light red - error backgrounds
  info: '#4780aa',              // Info blue
  infoLight: '#cde9f6',         // Light info blue
  
  // Neutral/Gray Scale
  neutral: '#8d8d8d',           // Gray - pending, not applicable
  
  // Text Colors
  textPrimary: '#161616',       // Primary text color
  textSecondary: '#525252',     // Secondary text color
  textMuted: '#6b7280',         // Muted/disabled text
  textLight: '#9ca3af',         // Very light text
  
  // Background Colors
  bgPrimary: '#ffffff',         // White background
  bgSecondary: '#f4f4f4',       // Light gray background
  bgTertiary: '#f7f8fb',        // Very light background
  bgDark: '#161616',            // Dark background
  bgOverlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Border Colors
  border: '#c6c6c6',            // Default border
  borderLight: '#e4e7ea',       // Light border
  borderDark: '#525252',        // Dark border
  
  // Status Colors (for compliance states)
  compliant: '#198038',         // Green - passing controls
  nonCompliant: '#da1e28',      // Red - failed checks
  pending: '#8d8d8d',           // Gray - not started
  
  // Legacy Color Mappings (for backward compatibility)
  purple: '#0043ce',            // Maps to Trust Blue
  blue: '#0043ce',              // Maps to Trust Blue
  
  // Utility Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Alpha Variants (with transparency)
  primaryAlpha15: 'rgba(0, 67, 206, 0.15)',
  primaryAlpha30: 'rgba(0, 67, 206, 0.30)',
  primaryAlpha50: 'rgba(0, 67, 206, 0.50)',
  blackAlpha20: 'rgba(0, 0, 0, 0.2)',
  blackAlpha50: 'rgba(0, 0, 0, 0.5)',
  blackAlpha80: 'rgba(0, 0, 0, 0.8)',
  whiteAlpha50: 'rgba(255, 255, 255, 0.5)',
  whiteAlpha70: 'rgba(255, 255, 255, 0.7)',
  whiteAlpha80: 'rgba(255, 255, 255, 0.8)',
  whiteAlpha90: 'rgba(255, 255, 255, 0.9)',
};

/**
 * Get color with custom opacity
 * @param {string} hexColor - Hex color code (e.g., '#0043ce')
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGBA color string
 */
export const withOpacity = (hexColor, opacity) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get CSS variable reference
 * Use this when you want to reference CSS custom properties
 * @param {string} varName - CSS variable name without '--' prefix
 * @returns {string} CSS var() reference
 */
export const cssVar = (varName) => `var(--${varName})`;

export default COLORS;

// Made with Bob
