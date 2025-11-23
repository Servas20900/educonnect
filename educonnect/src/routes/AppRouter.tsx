import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ExternalLayout from "../layouts/ExternalLayout";
import InternalLayout from "../layouts/InternalLayout";
import Dashboard from "../pages/admin/Dashboard";
import Login from "../pages/Login";
import CircularesList from "../pages/admin/CircularesList";
import CircularesEdit from "../pages/admin/CircularesEdit";
import Horarios from "../pages/admin/Horarios";
import DocenteDashboard from "../pages/docente/DocenteDashboard";
import EstudianteHome from "../pages/estudiante/Home";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<ExternalLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>

        {/* Rutas privadas (envolver con auth guard) */}
        <Route element={<InternalLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/circulares" element={<CircularesList />} />
          <Route path="/admin/circulares/:id" element={<CircularesEdit />} />
          <Route path="/admin/horarios" element={<Horarios />} />

          <Route path="/docente" element={<DocenteDashboard />} />
          <Route path="/estudiante" element={<EstudianteHome />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<div>404 — Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}
