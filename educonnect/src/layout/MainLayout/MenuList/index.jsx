import { memo, useState } from 'react';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import menuItems from '../../../menu-items';
import useAuth from '../../../hooks/useAuth';

import { useGetMenuMaster } from '../../../api/menu';

// ==============================|| SIDEBAR MENU LIST ||============================== //

function MenuList() {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const { role } = useAuth();
  const currentRole = role;
  const [selectedID, setSelectedID] = useState('');
  
  const lastItem = null;

  const filteredItems = menuItems.items.filter((item) => {
    if (!item.allowedRoles) return true;
    return currentRole ? item.allowedRoles.includes(currentRole) : false;
  });

  let lastItemIndex = filteredItems.length - 1;
  let remItems = [];
  let lastItemId;

  if (lastItem && lastItem < filteredItems.length) {
    lastItemId = filteredItems[lastItem - 1].id;
    lastItemIndex = lastItem - 1;
    remItems = filteredItems.slice(lastItem - 1, filteredItems.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon,
      ...(item.url && {
        url: item.url
      })
    }));
  }

  const navItems = filteredItems.slice(0, lastItemIndex + 1).map((item, index) => {
    switch (item.type) {
      case 'group':
        if (item.url && item.id !== lastItemId) {
          return (
            <List key={item.id}>
              <NavItem item={item} level={1} isParents setSelectedID={() => setSelectedID('')} />
              {index !== 0 && <Divider sx={{ py: 0.5 }} />}
            </List>
          );
        }

        return (
          <NavGroup
            key={item.id}
            setSelectedID={setSelectedID}
            selectedID={selectedID}
            item={item}
            lastItem={lastItem}
            remItems={remItems}
            lastItemId={lastItemId}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  return <Box {...(drawerOpen && { sx: { mt: 1.5 } })}>{navItems}</Box>;
}

export default memo(MenuList);
