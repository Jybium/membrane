import { createTheme } from '@mui/material';

export const theme = createTheme({
  typography: {
    fontFamily: [
      '"Plus Jakarta Sans"',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600 },
    body1: { fontSize: '0.92rem', lineHeight: 1.55 },
    body2: { fontSize: '0.84rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#4f46e5', // Modern Indigo
      light: '#6366f1',
      dark: '#4338ca',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0284c7', // Modern Sky
      light: '#0ea5e9',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669', // Clinical Emerald
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706', // Amber
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // Clean Crimson
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#090a0f', // Neutral Charcoal / Zinc Black
      paper: '#11131a',   // Flat solid card background
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
    },
    divider: '#1e2230',
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#090a0f',
          color: '#f3f4f6',
          scrollbarColor: '#282d40 #090a0f',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#11131a',
          border: '1px solid #1e2230',
          boxShadow: 'none !important',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#11131a',
          border: '1px solid #1e2230',
          boxShadow: 'none !important',
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: '#2d3348',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: 8,
          padding: '7px 16px',
          fontWeight: 600,
          boxShadow: 'none !important',
          transition: 'all 0.15s ease',
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#4338ca',
              boxShadow: 'none !important',
            },
          }),
          ...(ownerState.variant === 'contained' && ownerState.color === 'success' && {
            backgroundColor: '#059669',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#047857',
              boxShadow: 'none !important',
            },
          }),
          ...(ownerState.variant === 'outlined' && {
            borderColor: '#262a3b',
            color: '#f3f4f6',
            '&:hover': {
              borderColor: '#3b425b',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              boxShadow: 'none !important',
            },
          }),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          boxShadow: 'none !important',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#1e2230',
          padding: '12px 16px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          backgroundColor: '#11131a',
          border: '1px solid #262a3b',
          boxShadow: 'none !important',
        },
      },
    },
  },
});
