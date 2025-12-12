export default function Notificaciones(){
const notificacionesSimuladas = [
    { id: 1, tipo: 'Comunicado Profesor', mensaje: 'Nueva tarea asignada por Docente Pérez.', fecha: '2025-12-11' },
    { id: 2, tipo: 'Asistencia', mensaje: 'Su hijo(a) estuvo ausente el día 2025-12-09.', fecha: '2025-12-09' },
    { id: 3, tipo: 'General', mensaje: 'Circular de cierre de período disponible.', fecha: '2025-12-05' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
        Mis Notificaciones Automáticas
      </h1>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Alertas de Profesor y Comunicados 
        </h2>
        
        <div className="space-y-4">
          {notificacionesSimuladas.map(notif => (
            <div key={notif.id} className="p-4 border rounded-lg hover:bg-yellow-50 transition duration-150 flex justify-between items-center">
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${notif.tipo === 'Comunicado Profesor' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                  {notif.tipo}
                </span>
                <p className="text-gray-900 font-medium mt-1">
                  {notif.mensaje}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recibido: {notif.fecha}
                </p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Ver detalle
              </button>
            </div>
          ))}

          {notificacionesSimuladas.length === 0 && (
            <div className="p-4 bg-gray-100 text-gray-600 rounded-md text-center">
              No hay notificaciones pendientes.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
