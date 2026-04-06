import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IconMenu2, IconUser, IconLogout } from '@tabler/icons-react';
import { handlerDrawerOpen, useGetMenuMaster } from '../../api/menu';
import useAuth from '../../hooks/useAuth';
import useSystemConfig from '../../hooks/useSystemConfig';

function getBreadcrumb(pathname, navigation = []) {
  for (const group of navigation) {
    for (const child of group.children || []) {
      for (const item of child.children || []) {
        if (item.url && pathname.startsWith(item.url)) {
          return { section: group.title, page: item.title };
        }
      }
      if (child.url && pathname.startsWith(child.url)) {
        return { section: group.title, page: child.title };
      }
    }
  }
  return { section: '', page: '' };
}

export default function Topbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, username, role, roles } = useAuth();
  const { getNavigationForRole } = useSystemConfig();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const downMD = useMediaQuery('(max-width:900px)');
  const [anchorEl, setAnchorEl] = useState(null);

  const groups = getNavigationForRole(roles?.length ? roles : role);
  const { section, page } = getBreadcrumb(pathname, groups);
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : role?.[0]?.toUpperCase() || 'U';
  const displayName = username || role || 'Usuario';

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); navigate('/login', { replace: true }); };

  return (
    <Box
      component="header"
      sx={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 1.5,
        bgcolor: 'background.paper',
        borderBottom: '0.5px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <IconButton
        size="small"
        onClick={() => handlerDrawerOpen(!drawerOpen)}
        sx={{
          width: 32, height: 32, borderRadius: '6px',
          border: '0.5px solid', borderColor: 'divider',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <IconMenu2 size={16} stroke={1.5} />
      </IconButton>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {section && <>{section} / </>}
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{page}</Box>
        </Typography>
      </Box>

      {!downMD && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {displayName}
        </Typography>
      )}

      <Box
        onClick={handleOpen}
        sx={{
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: '#e6f1fb', color: '#185fa5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          userSelect: 'none',
          '&:hover': { bgcolor: '#d0e8f8' },
        }}
      >
        {initials}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: {
            border: '0.5px solid', borderColor: 'divider',
            borderRadius: '8px', minWidth: 160, mt: 0.5,
            boxShadow: 'none',
          },
        }}
      >
        <MenuItem onClick={() => { handleClose(); navigate('/perfil'); }}>
          <ListItemIcon><IconUser size={16} stroke={1.5} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13 }}>Perfil</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><IconLogout size={16} stroke={1.5} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13 }}>Cerrar sesión</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
