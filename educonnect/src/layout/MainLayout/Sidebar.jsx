import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IconLayoutDashboard, IconFileText, IconCalendar, IconFolder, IconUsers,
  IconChartBar, IconAlertTriangle, IconClipboardList, IconMessageCircle,
  IconDownload, IconShieldCheck, IconDatabase, IconFileCheck,
  IconNotes, IconUsersGroup, IconLogin, IconUser, IconFileStack,
  IconReportAnalytics, IconHeartHandshake } from '@tabler/icons-react';

import { handlerDrawerOpen, useGetMenuMaster } from '../../api/menu';
import useAuth from '../../hooks/useAuth';
import menuItems from '../../menu-items';
import { ROLES } from '../../constants/roles';

const ICON_MAP = {
  dashboard:              IconLayoutDashboard,
  circulares:             IconFileText,
  horarios:               IconCalendar,
  documentos:             IconFolder,
  usuarios:               IconUsers,
  incapacidades:          IconHeartHandshake,
  comites:                IconUsersGroup,
  reportes:               IconChartBar,
  backups:                IconDatabase,
  academico:              IconClipboardList,
  planeamientos:          IconFileCheck,
  comunicados:            IconMessageCircle,
  asistencia:             IconCalendar,
  exportaciones:          IconDownload,
  riesgo:                 IconAlertTriangle,
  'crear-acta':           IconFileText,
  'agendar-reunion':      IconCalendar,
  'roles-comite':         IconUsers,
  'informes-economicos':  IconReportAnalytics,
  reglamentos:            IconFileText,
  'reportes-cumplimiento':IconChartBar,
  'estudiante-comunicados': IconMessageCircle,
  'docente-estudiantes':  IconUsers,
  perfil:                 IconUser,
};

const SIDEBAR_W_OPEN = 240;
const SIDEBAR_W_CLOSED = 56;

function NavItem({ item, open, onClick, active }) {
  const Icon = ICON_MAP[item.id] || IconFileText;

  const inner = (
    <Box
      onClick={() => onClick(item.url)}
      sx={{
        display: 'flex', alignItems: 'center',
        gap: open ? 1.25 : 0,
        px: open ? 1 : 0,
        py: 0.875,
        mx: open ? 0 : 'auto',
        width: open ? '100%' : 40,
        height: open ? 'auto' : 40,
        justifyContent: open ? 'flex-start' : 'center',
        borderRadius: '6px',
        cursor: 'pointer',
        position: 'relative',
        bgcolor: active ? '#e6f1fb' : 'transparent',
        color: active ? '#185fa5' : 'text.secondary',
        transition: 'background .12s, color .12s',
        '&:hover': { bgcolor: active ? '#e6f1fb' : 'action.hover' },
        overflow: 'hidden',
      }}
    >
      {active && (
        <Box sx={{
          position: 'absolute', left: 0, top: 4, bottom: 4,
          width: 3, bgcolor: '#185fa5', borderRadius: '0 2px 2px 0',
        }} />
      )}
      <Icon size={16} stroke={1.5} style={{ flexShrink: 0 }} />
      {open && (
        <Typography
          sx={{
            fontSize: 13, fontWeight: active ? 500 : 400,
            color: 'inherit', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </Typography>
      )}
    </Box>
  );

  if (!open) {
    return (
      <Tooltip title={item.title} placement="right" arrow>
        {inner}
      </Tooltip>
    );
  }
  return inner;
}

function SidebarContent({ drawerOpen }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role, logout } = useAuth();

  const filteredGroups = menuItems.items.filter((group) => {
    if (!group.allowedRoles) return true;
    return role ? group.allowedRoles.includes(role) : false;
  });

  const grouped = filteredGroups.map((group) => ({
    title: group.title,
    items: (group.children || []).flatMap((c) => c.children || []),
  }));

  const handleNav = (url) => {
    if (url) navigate(url);
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          height: 52, display: 'flex', alignItems: 'center',
          px: drawerOpen ? 2 : 0, justifyContent: drawerOpen ? 'flex-start' : 'center',
          borderBottom: '0.5px solid', borderColor: 'divider', flexShrink: 0,
          gap: 1.25, overflow: 'hidden',
        }}
      >
    <Box sx={{
    width: 28, height: 28, borderRadius: '6px',
    overflow: 'hidden', flexShrink: 0,
    }}>
    <img
        src="https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg"
        alt="logo"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
    </Box>
        {drawerOpen && (
          <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            EduConnect
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          px: drawerOpen ? 1 : 0.5, py: 1,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {grouped.map((group) => (
          <Box key={group.title} sx={{ mb: 0.5 }}>
            {drawerOpen && (
              <Typography sx={{
                fontSize: 10, fontWeight: 500, color: 'text.disabled',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                px: 1, py: 0.75,
              }}>
                {group.title}
              </Typography>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                open={drawerOpen}
                onClick={handleNav}
                active={pathname.startsWith(item.url)}
              />
            ))}
          </Box>
        ))}
      </Box>

      <Box sx={{
        borderTop: '0.5px solid', borderColor: 'divider',
        px: drawerOpen ? 1 : 0.5, py: 1, flexShrink: 0,
      }}>
        <NavItem
          item={{ id: 'perfil', title: 'Mi perfil', url: '/perfil' }}
          open={drawerOpen}
          onClick={handleNav}
          active={pathname === '/perfil'}
        />
        <Box
          onClick={handleLogout}
          sx={{
            display: 'flex', alignItems: 'center',
            gap: drawerOpen ? 1.25 : 0,
            px: drawerOpen ? 1 : 0,
            py: 0.875,
            mx: drawerOpen ? 0 : 'auto',
            width: drawerOpen ? '100%' : 40,
            height: drawerOpen ? 'auto' : 40,
            justifyContent: drawerOpen ? 'flex-start' : 'center',
            borderRadius: '6px', cursor: 'pointer',
            color: 'error.main',
            '&:hover': { bgcolor: 'error.lighter' },
          }}
        >
          <IconLogin size={16} stroke={1.5} style={{ flexShrink: 0 }} />
          {drawerOpen && (
            <Typography sx={{ fontSize: 13, color: 'inherit', whiteSpace: 'nowrap' }}>
              Cerrar sesión
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function Sidebar() {
  const downMD = useMediaQuery('(max-width:900px)');
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? true;
  const width = drawerOpen ? SIDEBAR_W_OPEN : SIDEBAR_W_CLOSED;

  const paperSx = {
    width,
    overflow: 'hidden',
    transition: 'width .2s ease',
    bgcolor: 'background.paper',
    borderRight: '0.5px solid',
    borderColor: 'divider',
    boxShadow: 'none',
  };

  if (downMD) {
    return (
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => handlerDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { ...paperSx, width: SIDEBAR_W_OPEN } }}
      >
        <SidebarContent drawerOpen={true} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      PaperProps={{ sx: { ...paperSx, position: 'fixed', top: 0, left: 0, height: '100vh' } }}
    >
      <SidebarContent drawerOpen={drawerOpen} />
    </Drawer>
  );
}

export default memo(Sidebar);
