import { RouterProvider } from 'react-router-dom';

// routing
import router from './routes/index';

// material-ui
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// project imports
import NavigationScroll from './layout/NavigationScroll';
import { ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider } from './contexts/AuthContext';


// ==============================|| APP ||============================== //

export default function App() {
  // Theme is centralized in src/theme (imported at module top)

  return (
    <AuthProvider>
      <ConfigProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NavigationScroll>
            <RouterProvider router={router} />
          </NavigationScroll>
        </ThemeProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
