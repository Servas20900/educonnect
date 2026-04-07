
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, FileText, FolderKanban, LayoutGrid, ShieldCheck, Users } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useSystemConfig from '../../hooks/useSystemConfig';

export default function Dashboard() {
  const { user } = useAuth();
  const { branding } = useSystemConfig();

  const modulos = [
    {
      title: 'Usuarios',
      description: 'Administra docentes, estudiantes, grupos y permisos de acceso.',
      href: '/usuarios',
      icon: Users,
      cardClass: 'border-blue-200 bg-blue-50/80 hover:bg-blue-100/70',
      iconClass: 'bg-blue-100 text-blue-700',
      linkColor: '#1d4ed8',
    },
    {
      title: 'Circulares',
      description: 'Publica y organiza comunicados institucionales por estado.',
      href: '/circulares',
      icon: FileText,
      cardClass: 'border-blue-300 bg-blue-100/70 hover:bg-blue-100',
      iconClass: 'bg-blue-200 text-blue-800',
      linkColor: '#1e40af',
    },
    {
      title: 'Comites',
      description: 'Da seguimiento a actas, reuniones y roles del comite.',
      href: '/comites',
      icon: ShieldCheck,
      cardClass: 'border-sky-300 bg-sky-50/80 hover:bg-sky-100/70',
      iconClass: 'bg-sky-100 text-sky-700',
      linkColor: '#0369a1',
    },
    {
      title: 'Documentos',
      description: 'Gestiona carpetas, plantillas y repositorios institucionales.',
      href: '/documentos',
      icon: FolderKanban,
      cardClass: 'border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100/70',
      iconClass: 'bg-indigo-100 text-indigo-700',
      linkColor: '#3730a3',
    },
  ];

  const fechaHoy = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border" style={{ background: '#fff', borderColor: '#e2e4e9' }}>
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: '#378add' }}>
              Bienvenida
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight" style={{ color: '#0b2545' }}>
              Hola {user?.username || 'Administrador'},
              <br />
              que bueno tenerte de vuelta.
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#8a8f9e' }}>
              Este espacio centraliza los accesos principales para la gestion academica y administrativa de {branding.institution_name || 'la institucion'}.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/usuarios"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: '#0b2545' }}
              >
                <LayoutGrid size={16} />
                Ir a modulos
              </Link>
              <Link
                to="/reportes"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: '#d8dae0', color: '#0b2545', background: '#fafbfc' }}
              >
                <Calendar size={16} />
                Ver actividad
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l p-6" style={{ borderColor: '#e9ecf2', background: '#fafbfc' }}>
            <div className="w-11 h-11 rounded-xl overflow-hidden mb-4">
              <img
                src={branding.logo_url || 'https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg'}
                alt="logo"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748b' }}>
              {branding.app_name || 'EduConnect'}
            </p>
            <h2 className="mt-1 text-base font-semibold" style={{ color: '#0b2545' }}>
              {branding.institution_name || 'Escuela Manuela Santamaria Rodriguez'}
            </h2>
            <p className="mt-3 text-sm capitalize" style={{ color: '#8a8f9e' }}>
              {fechaHoy}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <Link
              key={modulo.title}
              to={modulo.href}
              className={`group rounded-xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${modulo.cardClass}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: '#0b2545' }}>
                    {modulo.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: '#8a8f9e' }}>
                    {modulo.description}
                  </p>
                </div>
                <span className={`rounded-lg p-2.5 ${modulo.iconClass}`}>
                  <Icon size={18} />
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: modulo.linkColor }}>
                Abrir
                <ArrowRight size={15} />
              </div>
            </Link>
          );
        })}
      </section>

    </div>
  );
}
