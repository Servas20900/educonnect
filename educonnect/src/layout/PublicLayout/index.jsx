import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-indigo-700">EduConnect</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-indigo-700">Inicio</Link>
            <Link to="/login" className="hover:text-indigo-700">Iniciar sesión</Link>
            <Link to="/register" className="hover:text-indigo-700">Registrarse</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10"><Outlet /></main>
      <footer className="mt-10 border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">© {new Date().getFullYear()} EduConnect</div>
      </footer>
    </div>
  );
}
