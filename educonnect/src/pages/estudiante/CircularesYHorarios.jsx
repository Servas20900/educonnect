import ConsultaHorarios from './HelperComponents/ConsultaHorarios';
import { useEffect, useState } from 'react';
import { fetchComunicados } from '../../api/comunicadosService';

const formatFecha = (fecha) => {
    if (!fecha) return '—';
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-CR');
};

export default function CircularesYHorarios() {
    const [comunicados, setComunicados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarComunicados = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchComunicados();
                setComunicados(data || []);
            } catch {
                setError('No se pudieron cargar los comunicados.');
            } finally {
                setLoading(false);
            }
        };

        cargarComunicados();
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
                Portal de Consulta de Usuario
            </h1>

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    Circulares y Avisos (RF-030)
                    {!loading && comunicados.length > 0 && (
                        <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            {comunicados.length} Nuevos
                        </span>
                    )}
                </h2>

                <div className="space-y-4">
                    {loading && (
                        <div className="p-4 border border-gray-100 rounded-md text-sm text-gray-500">
                            Cargando comunicados...
                        </div>
                    )}

                    {!loading && error && (
                        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!loading && !error && comunicados.length === 0 && (
                        <div className="p-4 border border-gray-100 rounded-md text-sm text-gray-500">
                            No hay comunicados disponibles.
                        </div>
                    )}

                    {!loading && !error && comunicados.map((comunicado) => (
                        <div key={comunicado.id} className="p-4 border border-gray-100 rounded-md hover:bg-teal-50 transition duration-150">
                            <p className="text-lg font-medium text-gray-800">{comunicado.titulo}</p>
                            <p className="text-sm text-gray-500">Publicado: {formatFecha(comunicado.fecha_publicacion)}</p>
                            <p className="text-sm text-gray-600 mt-1">{comunicado.contenido}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Consulta de Horarios
                </h2>

                <ConsultaHorarios />
            </section>
        </div>
    );
};

