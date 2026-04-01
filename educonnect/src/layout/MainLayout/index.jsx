import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { handlerDrawerOpen, useGetMenuMaster } from '../../api/menu';
import useConfig from '../../hooks/useConfig';
import Loader from '../../components/ui/Loader';

export default function MainLayout() {
  const downMD = useMediaQuery('(max-width:900px)');
  const { miniDrawer } = useConfig();
  const { menuMaster, menuMasterLoading } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;

  useEffect(() => {
    handlerDrawerOpen(!miniDrawer);
  }, [miniDrawer]);

  useEffect(() => {
    if (downMD) handlerDrawerOpen(false);
  }, [downMD]);

  if (menuMasterLoading) return <Loader />;

  const SIDEBAR_W = drawerOpen ? 240 : 56;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          ml: downMD ? 0 : `${SIDEBAR_W}px`,
          transition: 'margin-left .2s ease',
        }}
      >
        <Topbar />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, maxWidth: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
