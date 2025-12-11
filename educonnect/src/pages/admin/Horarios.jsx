import React from 'react';
import FormularioHorario from './HelperComponents/FormularioHorario';
import RevisionHorarios from './HelperComponents/RevisionHorarios';

export default function Horarios() {
  const horariosDocentesPendientes = [
    { id: 101, docente: 'Juan Pérez', curso: 'Matemáticas 10mo' },
    { id: 102, docente: 'María López', curso: 'Ciencias 11mo' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        Gestión de Horarios Académicos
      </h2>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Crear/Editar Horario (RF-003)
        </h2>
        {/* Este componente gestiona el CRUD directo del administrador */}
        <FormularioHorario />
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Horarios Pendientes de Aprobación (RF-004)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Revisión de horarios propuestos por docentes.
        </p>

        {horariosDocentesPendientes.length > 0 ? (
          <RevisionHorarios horarios={horariosDocentesPendientes} />
        ) : (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
            <p className="font-medium">No hay horarios pendientes de revisión.</p>
          </div>
        )}
      </section>
    </div>
  );
};

