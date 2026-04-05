import { Outlet, Link, useLocation } from 'react-router-dom';
import useSystemConfig from '../../hooks/useSystemConfig';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const { branding, getPublicNav } = useSystemConfig();
  const navLinks = getPublicNav();

  return (
    <div className="min-h-screen flex">
      <aside
        style={{ width: '42%', minWidth: 260, maxWidth: 400, background: '#0b2545' }}
        className="hidden md:flex flex-col justify-between p-9 flex-shrink-0"
      >
        <div>
          <div className="w-11 h-11 rounded-xl overflow-hidden mb-7">
            <img
              src={branding.logo_url || 'https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg'}
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,.4)' }}>
            Sistema escolar
          </p>
          <h1 className="text-xl font-medium leading-snug mb-3.5" style={{ color: '#fff' }}>
            {branding.institution_name || 'Escuela Manuela Santamaria Rodriguez'}
          </h1>
          <div className="w-8 h-0.5 rounded mb-3.5" style={{ background: '#378add' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,.45)' }}>
            Plataforma institucional para la gestión académica y administrativa de la comunidad educativa.
          </p>
        </div>

        <div>
          <nav className="flex flex-col">
            {navLinks.map((link) => {
              const active = pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 py-2 text-xs transition-colors border-b"
                  style={{
                    color: active ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.35)',
                    borderColor: 'rgba(255,255,255,.07)',
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: 'currentColor' }}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <p className="text-xs mt-5" style={{ color: 'rgba(255,255,255,.18)' }}>
            © {new Date().getFullYear()} {branding.app_name || 'EduConnect'}
          </p>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center bg-slate-50 p-6 md:p-10 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
