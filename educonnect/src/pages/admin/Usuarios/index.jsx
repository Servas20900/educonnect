import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/ui';

export default function UsuariosHome() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const subsecciones = [
    {
      id: 'docentes',
      titulo: 'Docentes',
      descripcion: 'Gestionar docentes, crear, editar y eliminar registros',
      icono: <Users className="w-16 h-16" />,
      color: 'from-blue-500 to-blue-600',
        ruta: 'docentes',
    },
    {
      id: 'estudiantes',
      titulo: 'Estudiantes',
      descripcion: 'Administrar estudiantes, asignaciones y grupos',
      icono: <BookOpen className="w-16 h-16" />,
      color: 'from-green-500 to-green-600',
        ruta: 'estudiantes',
    },
    {
      id: 'grados-grupos',
      titulo: 'Grados y Grupos',
      descripcion: 'Organizar grados, crear grupos y gestionar estudiantes',
      icono: <GraduationCap className="w-16 h-16" />,
      color: 'from-purple-500 to-purple-600',
        ruta: 'grados-grupos',
    },
    {
      id: 'permisos',
      titulo: 'Permisos y Roles',
      descripcion: 'Gestionar matriz de permisos y asignación de roles por usuario',
      icono: <ShieldCheck className="w-16 h-16" />,
      color: 'from-[#185fa5] to-[#0b2545]',
      ruta: 'permisos',
    },
  ];

  const handleNavigate = (ruta) => {
    navigate(ruta);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        subtitle="Selecciona una sección para gestionar docentes, estudiantes, grupos y permisos"
      />

      <div className="max-w-6xl">

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {subsecciones.map((seccion) => (
            <div
              key={seccion.id}
              onMouseEnter={() => setHoveredCard(seccion.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleNavigate(seccion.ruta)}
              className={`
                relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md
                transform hover:scale-105 transition-all duration-300 cursor-pointer
                overflow-hidden group
              `}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${seccion.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              {/* Content Container */}
              <div className="relative p-8 flex flex-col items-center justify-center h-full min-h-72">
                {/* Icon */}
                <div className={`mb-6 text-transparent bg-clip-text bg-gradient-to-br ${seccion.color} group-hover:scale-110 transition-transform duration-300`}>
                  {seccion.icono}
                </div>

                {/* Title */}
                <h2 className={`text-2xl font-bold text-center mb-3 transition-all duration-300 ${
                  hoveredCard === seccion.id
                    ? `text-transparent bg-clip-text bg-gradient-to-br ${seccion.color}`
                    : 'text-[#0b2545]'
                }`}>
                  {seccion.titulo}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-center text-sm leading-relaxed flex-1 flex items-center justify-center">
                  {seccion.descripcion}
                </p>

                {/* Arrow Indicator */}
                <div className={`mt-6 transform transition-all duration-300 ${
                  hoveredCard === seccion.id
                    ? 'translate-x-1 opacity-100'
                    : 'translate-x-0 opacity-50'
                }`}>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Bottom Border Accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${seccion.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-lg border border-[#cfe3f7] bg-[#e6f1fb] p-6">
          <h3 className="mb-2 text-lg font-semibold text-[#0b2545]">Información</h3>
          <p className="text-[#185fa5]">
            El sistema de usuario permite gestionar docentes, estudiantes, organización académica y control de permisos por roles.
            Se requieren permisos de administrador para acceder a estas funciones.
          </p>
        </div>
      </div>
    </div>
  );
}
