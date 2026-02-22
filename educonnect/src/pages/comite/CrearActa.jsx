import { useEffect, useState } from 'react';
import {
    createActa,
    createReporteComite,
    fetchActas,
    fetchReportesComite
} from '../../api/comitesService';

const initialForm = {
    tipoDoc: 'acta',
    titulo: '',
    descripcion: '',
    acuerdos: '',
    acciones: '',
    archivo: null
};

function parseError(error) {
    if (!error) return 'Ocurrió un error inesperado.';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (typeof error === 'object') {
        return Object.entries(error)
            .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');
    }
    return 'No fue posible guardar el documento.';
}

export default function CrearActa() {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actas, setActas] = useState([]);
    const [reportes, setReportes] = useState([]);

    const cargarDocumentos = async () => {
        setLoading(true);
        try {
            const [actasData, reportesData] = await Promise.all([
                fetchActas(),
                fetchReportesComite()
            ]);
            setActas(Array.isArray(actasData) ? actasData : []);
            setReportes(Array.isArray(reportesData) ? reportesData : []);
        } catch {
            setError('No se pudieron cargar actas y reportes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDocumentos();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!form.titulo || !form.descripcion || !form.acuerdos || !form.acciones) {
            setError('Completa título, contenido, decisiones y acciones.');
            return;
        }

        setGuardando(true);
        try {
            if (form.tipoDoc === 'acta') {
                await createActa({
                    reunion: null,
                    numero_acta: form.titulo,
                    contenido: form.descripcion,
                    acuerdos: form.acuerdos,
                    seguimientos: form.acciones,
                    estado: 'borrador'
                });
                setSuccess('Acta creada correctamente.');
            } else {
                await createReporteComite({
                    organo: null,
                    periodo: null,
                    tipo_informe: 'reporte_comite',
                    titulo: form.titulo,
                    contenido: form.descripcion,
                    conclusiones: form.acuerdos,
                    recomendaciones: form.acciones,
                    archivo_adjunto: form.archivo ? form.archivo.name : null,
                    estado: 'borrador'
                });
                setSuccess('Reporte creado correctamente.');
            }

            setForm(initialForm);
            await cargarDocumentos();
        } catch (submitError) {
            setError(parseError(submitError));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-full space-y-8">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">
                Creación de Acta o Reporte de Comité
            </h2>

            {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

            <form className="space-y-6" onSubmit={onSubmit}>
                <div>
                    <label htmlFor="tipoDoc" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Documento
                    </label>
                    <select
                        id="tipoDoc"
                        name="tipoDoc"
                        value={form.tipoDoc}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="acta">Acta de Reunión</option>
                        <option value="reporte">Reporte de Avance</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                        Título/Asunto
                    </label>
                    <input
                        type="text"
                        id="titulo"
                        name="titulo"
                        value={form.titulo}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido o Resumen
                    </label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        rows="4"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="acuerdos" className="block text-sm font-medium text-gray-700 mb-1">
                            Decisiones / Acuerdos
                        </label>
                        <textarea
                            id="acuerdos"
                            name="acuerdos"
                            value={form.acuerdos}
                            onChange={handleChange}
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="acciones" className="block text-sm font-medium text-gray-700 mb-1">
                            Acciones / Seguimientos
                        </label>
                        <textarea
                            id="acciones"
                            name="acciones"
                            value={form.acciones}
                            onChange={handleChange}
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-1">
                        Adjuntar Documento (opcional)
                    </label>
                    <input
                        type="file"
                        id="archivo"
                        onChange={(e) => setForm((prev) => ({ ...prev, archivo: e.target.files?.[0] || null }))}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
                    >
                        {guardando ? 'Guardando...' : 'Guardar Documento'}
                    </button>
                </div>
            </form>

            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Documentos recientes</h3>
                {loading ? (
                    <div className="text-sm text-gray-500">Cargando documentos...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-md border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Actas</h4>
                            {actas.length === 0 ? (
                                <p className="text-xs text-gray-500">No hay actas registradas.</p>
                            ) : (
                                <ul className="space-y-1 text-sm text-gray-700">
                                    {actas.slice(0, 5).map((acta) => (
                                        <li key={acta.id}>• {acta.numero_acta}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="rounded-md border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Reportes</h4>
                            {reportes.length === 0 ? (
                                <p className="text-xs text-gray-500">No hay reportes registrados.</p>
                            ) : (
                                <ul className="space-y-1 text-sm text-gray-700">
                                    {reportes.slice(0, 5).map((reporte) => (
                                        <li key={reporte.id}>• {reporte.titulo}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
