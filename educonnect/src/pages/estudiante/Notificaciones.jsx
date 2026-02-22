import { useEffect, useState } from 'react';
import { fetchComunicados } from '../../api/comunicadosService';

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CR');
};

export default function Notificaciones(){
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarNotificaciones = async () => {
      setLoading(true);
      setError('');
      try {
        const comunicados = await fetchComunicados();
        const notificacionesMapeadas = (comunicados || []).map((comunicado) => ({
          id: comunicado.id,
          tipo: comunicado.tipo_comunicado === 'tarea' ? 'Tarea' : 'Comunicado',
          mensaje: comunicado.titulo,
          detalle: comunicado.contenido,
          fecha: comunicado.fecha_publicacion
        }));

        setNotificaciones(notificacionesMapeadas);
      } catch {
        setError('No se pudieron cargar las notificaciones.');
      } finally {
        setLoading(false);
      }
    };

    cargarNotificaciones();
  }, []);

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
          {loading && (
            <div className="p-4 bg-gray-100 text-gray-600 rounded-md text-center">
              Cargando notificaciones...
            </div>
          )}

          {!loading && error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md text-center border border-red-200">
              {error}
            </div>
          )}

          {!loading && !error && notificaciones.map(notif => (
            <div key={notif.id} className="p-4 border rounded-lg hover:bg-yellow-50 transition duration-150 flex justify-between items-center">
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${notif.tipo === 'Tarea' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                  {notif.tipo}
                </span>
                <p className="text-gray-900 font-medium mt-1">
                  {notif.mensaje}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {notif.detalle}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recibido: {formatFecha(notif.fecha)}
                </p>
              </div>
            </div>
          ))}

          {!loading && !error && notificaciones.length === 0 && (
            <div className="p-4 bg-gray-100 text-gray-600 rounded-md text-center">
              No hay notificaciones pendientes.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
