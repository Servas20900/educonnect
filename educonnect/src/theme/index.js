import { createTheme } from '@mui/material/styles';
import defaultConfig from 'config';

// Centralized theme for the app. Keep palette and overrides here.
const theme = createTheme({
  typography: {
    fontFamily: defaultConfig.fontFamily
  },
  shape: {
    borderRadius: defaultConfig.borderRadius
  },
  palette: {
    mode: 'light',
    primary: {
      light: '#cfeefb',
      main: '#0b74d1',
      dark: '#063f6f'
    },
    secondary: {
      light: '#b3ecf8',
      main: '#00a8d8',
      dark: '#007293'
    },
    background: {
      default: '#f7f9fb',
      paper: '#ffffff'
    }
  }
});

export default theme;
