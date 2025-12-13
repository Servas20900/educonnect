import { createBrowserRouter } from 'react-router-dom';

// routes
import MainRoutes from './MainRoutes';

// ==============================|| ROUTING RENDER ||============================== //

// `MainRoutes` is an array of route objects; pass directly.
const router = createBrowserRouter(MainRoutes, {
  basename: '/'
});

export default router;
