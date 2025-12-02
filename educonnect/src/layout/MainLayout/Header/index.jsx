// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// project imports

import { handlerDrawerOpen, useGetMenuMaster } from '../../../api/menu';

// assets
import { IconMenu2 } from '@tabler/icons-react';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  return (
    <>
      {/* hamburguer (left) & title */}
      <Box sx={{ width: downMD ? 'auto' : 228, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            overflow: 'hidden',
            transition: 'all .2s ease-in-out',
            bgcolor: 'secondary.light',
            color: 'secondary.dark',
            '&:hover': {
              bgcolor: 'secondary.dark',
              color: 'secondary.light'
            }
          }}
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          color="inherit"
        >
          <IconMenu2 stroke={1.5} size="20px" />
        </Avatar>

        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Educonnect
          </Typography>
        </Box>
      </Box>





    </>
  );
}
