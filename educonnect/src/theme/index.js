import { createTheme } from '@mui/material/styles';
import defaultConfig from 'config';

// Centralized theme for the app. Keep palette and overrides here.
export function createAppTheme(config = defaultConfig) {
  return createTheme({
    typography: {
      fontFamily: config.fontFamily,
      commonAvatar: {
        cursor: 'pointer',
        borderRadius: 8
      },
      menuCaption: {
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1.4,
        textTransform: 'uppercase'
      },
      subMenuCaption: {
        fontSize: '0.6875rem',
        fontWeight: 400,
        lineHeight: 1.35
      }
    },
    shape: {
      borderRadius: config.borderRadius
    },
    palette: {
      mode: config.mode,
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
}

export default createAppTheme(defaultConfig);
