/**
 * UAE-themed color palette for the Peergos mobile app
 */

const tintColorLight = '#1976d2';
const tintColorDark = '#64b5f6';

export const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: '#1976d2',
    secondary: '#4CAF50',
    accent: '#FF9800',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#e0e0e0',
    notification: '#f44336',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#64b5f6',
    secondary: '#81c784',
    accent: '#ffb74d',
    error: '#ef5350',
    success: '#66bb6a',
    warning: '#ffa726',
    info: '#42a5f5',
    surface: '#121212',
    card: '#1e1e1e',
    border: '#272729',
    notification: '#ff453a',
  },
};

export const UAEColors = {
  // UAE flag colors
  red: '#CE1126',
  green: '#00732F',
  white: '#FFFFFF',
  black: '#000000',
  
  // Business colors
  gold: '#FFD700',
  emirates: {
    abu_dhabi: '#B8860B',
    dubai: '#1976d2',
    sharjah: '#4CAF50',
    ajman: '#FF9800',
    umm_al_quwain: '#9C27B0',
    ras_al_khaimah: '#795548',
    fujairah: '#607D8B',
  },
  
  // Tax compliance colors
  vat: '#2196F3',      // Blue for VAT
  cit: '#4CAF50',      // Green for CIT
  compliant: '#4CAF50', // Green for compliant status
  warning: '#FF9800',   // Orange for warnings
  overdue: '#F44336',   // Red for overdue items
};