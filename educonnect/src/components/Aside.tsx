import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Aside({ open, onClose }: Props) {
  return (
    <>
      {/* overlay móvil */}
      <div
        className={`fixed inset-0 bg-black/40 z-20 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`z-30 bg-white w-64 border-r fixed md:static h-full transform ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } transition-transform`}
      >
        <div className="p-4 flex flex-col h-full">
          <div>
            <h3 className="text-lg font-bold">EduConnect</h3>
          </div>

          <nav className="mt-6 space-y-2 flex-1">
            <Link to="/admin/dashboard" className="block px-2 py-2 rounded hover:bg-gray-100">Dashboard</Link>
            <Link to="/admin/circulares" className="block px-2 py-2 rounded hover:bg-gray-100">Circulares</Link>
            <Link to="/admin/horarios" className="block px-2 py-2 rounded hover:bg-gray-100">Horarios</Link>
            <Link to="/admin/usuarios" className="block px-2 py-2 rounded hover:bg-gray-100">Usuarios</Link>
            <Link to="/admin/reportes" className="block px-2 py-2 rounded hover:bg-gray-100">Reportes</Link>
          </nav>

          <div className="mt-auto text-sm text-gray-500">v0.1 • EduConnect</div>
        </div>
      </aside>
    </>
  );
}
