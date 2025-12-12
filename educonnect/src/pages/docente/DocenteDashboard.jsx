export default function DocenteDashboard() {
  const gruposAsignados = [
    { id: 1, nombre: '10-1 (Matemáticas)', alumnos: 30 },
    { id: 2, nombre: '11-2 (Física)', alumnos: 25 },
  ];

return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
        Panel de Docente
      </h1>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Selección de Grupo Asignado
        </h2>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <select className="flex-grow mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm">
            <option value="">Seleccione su grupo...</option>
            {gruposAsignados.map(grupo => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Ver Lista de Estudiantes
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="p-5 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition duration-150">
          <h3 className="text-lg font-semibold text-gray-800">Gestión de Notas y Evaluaciones</h3>
          <p className="text-sm text-gray-500 mt-1">Crear, editar evaluaciones y registrar calificaciones.</p>
        </div>

        <div className="p-5 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition duration-150">
          <h3 className="text-lg font-semibold text-gray-800">Registrar Asistencia</h3>
          <p className="text-sm text-gray-500 mt-1">Marcar presente/ausente y justificar faltas.</p>
        </div>

        <div className="p-5 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition duration-150">
          <h3 className="text-lg font-semibold text-gray-800">Estudiantes en Riesgo</h3>
          <p className="text-sm text-gray-500 mt-1">Ver estadísticas de bajo rendimiento o ausencias.</p>
        </div>
        
        <div className="p-5 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition duration-150">
          <h3 className="text-lg font-semibold text-gray-800">Enviar Comunicados</h3>
          <p className="text-sm text-gray-500 mt-1">Enviar avisos o tareas a estudiantes/encargados.</p>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Subir Planeamientos
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border border-dashed rounded-md bg-gray-50">
          <p className="text-sm text-gray-600">
            Cargue su planeamiento académico para revisión.
          </p>
          <button className="mt-3 md:mt-0 px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            Subir Archivo
          </button>
        </div>
      </section>
    </div>
  );
};