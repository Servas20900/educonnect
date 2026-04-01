import { createTheme } from '@mui/material/styles';

export function createAppTheme(config = {}) {
  const mode = config.mode || 'light';
  const fontFamily = config.fontFamily || "'Roboto', sans-serif";
  const borderRadius = Number.isFinite(config.borderRadius)
    ? config.borderRadius
    : 8;

  return createTheme({
    palette: { mode },
    typography: { fontFamily },
    shape: { borderRadius }
  });
}
