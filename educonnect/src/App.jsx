// ESTANDAR DE ESTILOS - EduConnect
// 1. Layout shell (sidebar, topbar, drawer): MUI exclusivamente
// 2. Estructura de paginas (grids, spacing, fondos): Tailwind className
// 3. Componentes interactivos complejos (tablas, modales,
//    selects, date pickers): MUI con sx minimo
// Regla: sin inline style={} en pages - usar className o sx

import { useContext, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';

// routing
import router from './routes/index';

// material-ui
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';

// project imports
import { ConfigContext, ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider } from './contexts/AuthContext';


// ==============================|| APP ||============================== //

function AppWithTheme() {
  const config = useContext(ConfigContext);
  const theme = useMemo(
    () => createAppTheme(config),
    [config.fontFamily, config.borderRadius, config.mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <AppWithTheme />
      </ConfigProvider>
    </AuthProvider>
  );
}
