import { Link } from 'react-router-dom';

const FEATURES = [
  {
    category: 'Comunicación',
    title: 'Circulares y avisos',
    desc: 'Información institucional oficial',
    bg: '#e6f1fb', border: '#378add',
  },
  {
    category: 'Académico',
    title: 'Notas y asistencia',
    desc: 'Seguimiento del rendimiento',
    bg: '#cce3f8', border: '#85b7eb',
  },
  {
    category: 'Organización',
    title: 'Horarios y reuniones',
    desc: 'Calendario institucional',
    bg: '#b5d4f4', border: '#85b7eb',
  },
  {
    category: 'Administración',
    title: 'Reportes y control',
    desc: 'Auditoría y permisos',
    bg: '#cce3f8', border: '#b5d4f4',
  },
];

export default function PublicHome() {
  return (
    <div className="w-full max-w-lg">
      <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#378add' }}>
        Bienvenido
      </p>
      <h2 className="text-2xl font-medium leading-snug mb-2.5" style={{ color: '#0b2545' }}>
        Gestión escolar centralizada en un solo lugar
      </h2>
      <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7280', maxWidth: 360 }}>
        Accedé a circulares, horarios, calificaciones, comunicados y más desde tu perfil institucional.
      </p>

      <div className="flex gap-2 mb-8">
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#0b2545' }}
        >
          Iniciar sesión
        </Link>
        <Link
          to="/register"
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border"
          style={{ background: '#fff', color: '#0b2545', borderColor: '#d0d3db' }}
        >
          Registrarse
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-lg p-3.5 border"
            style={{ background: f.bg, borderColor: f.border }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#185fa5' }}>{f.category}</p>
            <p className="text-sm font-medium" style={{ color: '#0b2545' }}>{f.title}</p>
            <p className="text-xs mt-0.5" style={{ color: '#378add', opacity: .8 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
