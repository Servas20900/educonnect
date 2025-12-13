import { useState } from 'react';
// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// project imports

import { handlerDrawerOpen, useGetMenuMaster } from '../../../api/menu';
import useAuth from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// assets
import { IconMenu2, IconUser, IconSettings, IconLogout } from '@tabler/icons-react';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const goTo = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login', { replace: true });
  };

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

      <Box sx={{ flexGrow: 1 }} />

      <IconButton onClick={handleOpen} sx={{ ml: 1 }}>
        <Avatar sx={{ width: 36, height: 36 }}>U</Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => goTo('/perfil')}>
          <ListItemIcon>
            <IconUser size={18} />
          </ListItemIcon>
          <ListItemText>Perfil</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => goTo('/configuracion')}>
          <ListItemIcon>
            <IconSettings size={18} />
          </ListItemIcon>
          <ListItemText>Configuración</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <IconLogout size={18} />
          </ListItemIcon>
          <ListItemText>Cerrar sesión</ListItemText>
        </MenuItem>
      </Menu>





    </>
  );
}
