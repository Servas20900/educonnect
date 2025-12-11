import ConsultaHorarios from './HelperComponents/ConsultaHorarios';
const Usuarios = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-teal-800 mb-8 border-b pb-2">
        Portal de Consulta de Usuario
      </h1>

      {/* Sección de Comunicados (RF-030) */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          Circulares y Avisos (RF-030)
          <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
            3 Nuevos
          </span>
        </h2>
        
        <div className="space-y-4">
          {/*Aca se hara un map de cada circular enviada desde el backend */}
          <div className="p-4 border border-gray-100 rounded-md hover:bg-teal-50 transition duration-150 cursor-pointer">
            <p className="text-lg font-medium text-gray-800">Circular #15: Horario de Cierre Semanal</p>
            <p className="text-sm text-gray-500">Publicado: 2025-12-09</p>
          </div>
          <div className="p-4 border border-gray-100 rounded-md hover:bg-teal-50 transition duration-150 cursor-pointer">
            <p className="text-lg font-medium text-gray-800">Aviso: Tarea de Matemáticas (RF-019)</p>
            <p className="text-sm text-gray-500">Publicado: 2025-12-10</p>
          </div>
          <div className="p-4 border border-gray-100 rounded-md hover:bg-teal-50 transition duration-150 cursor-pointer">
            <p className="text-lg font-medium text-gray-800">Comunicado General de Dirección</p>
            <p className="text-sm text-gray-500">Publicado: 2025-12-08</p>
          </div>
        </div>
        <button className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-800">
          Ver todos los comunicados
        </button>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Consulta de Horarios (RF-031)
        </h2>
        
        <ConsultaHorarios />
      </section>
    </div>
  );
};

export default Usuarios;