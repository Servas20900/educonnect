import { Link as RouterLink } from 'react-router-dom';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        pt: 3,
        mt: 'auto'
      }}
    >
      <Typography variant="caption" color="text.secondary">
        &copy; {new Date().getFullYear()} Educonnect. All rights reserved.
      </Typography>
    </Stack>
  );
}
