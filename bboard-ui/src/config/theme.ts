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
      main: '#1A2A39', // Deep Navy
      light: '#24384C',
      dark: '#121E2A',
      contrastText: '#F6F3EC',
    },
    secondary: {
      main: '#4E93B4', // Muted Sky Blue
      light: '#6BA8C4',
      dark: '#3D7692',
      contrastText: '#F6F3EC',
    },
    success: {
      main: '#4E93B4',
      light: '#6BA8C4',
      dark: '#3D7692',
      contrastText: '#F6F3EC',
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
      default: '#121E2A',
      paper: '#1A2A39',
    },
    text: {
      primary: '#F6F3EC',
      secondary: '#8CA0B2',
    },
    divider: '#2B4257',
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121E2A',
          color: '#F6F3EC',
          scrollbarColor: '#24384C #121E2A',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A2A39',
          border: '1px solid #2B4257',
          boxShadow: 'none !important',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#1A2A39',
          border: '1px solid #2B4257',
          boxShadow: 'none !important',
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: '#4E93B4',
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
            backgroundColor: '#4E93B4',
            color: '#F6F3EC',
            '&:hover': {
              backgroundColor: '#3C7C9C',
              boxShadow: 'none !important',
            },
          }),
          ...(ownerState.variant === 'contained' && ownerState.color === 'success' && {
            backgroundColor: '#4E93B4',
            color: '#F6F3EC',
            '&:hover': {
              backgroundColor: '#3C7C9C',
              boxShadow: 'none !important',
            },
          }),
          ...(ownerState.variant === 'outlined' && {
            borderColor: '#2B4257',
            color: '#F6F3EC',
            '&:hover': {
              borderColor: '#4E93B4',
              backgroundColor: 'rgba(78, 147, 180, 0.08)',
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
          borderColor: '#2B4257',
          padding: '12px 16px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          backgroundColor: '#1A2A39',
          border: '1px solid #2B4257',
          boxShadow: 'none !important',
        },
      },
    },
  },
});
