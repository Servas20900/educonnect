import { useEffect, useState, useMemo } from 'react';
import useInformeEconomico from "./hooks/useInformeEconomico";
import InformeEconomicoForm from './InformeEconomicoForm';
import Toast from '../../../components/ui/Toast';
import Paginador from '../../../components/ui/Paginador';
import { BtnDescargar } from "../../../components/ui/ActionButtons";

export default function InformesEconomicos() {
    const { informes, loading, error, cargarInformes, ejecutarSubida, limpiarError, descargarInforme } = useInformeEconomico();

    const [form, setForm] = useState(false);
    const [object, setObject] = useState({});
    const [information, setInformation] = useState("");
    const [filtros, setFiltros] = useState({ nombre: "", estado: "" });

    useEffect(() => {
        cargarInformes();
    }, [cargarInformes]);

    const handleModalForm = () => {
        setForm(!form);
        setObject({});
    };

    const handleReemplazar = (informe) => {
        setObject(informe);
        setForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros({ ...filtros, [name]: value });
    };

    const informesFiltrados = useMemo(() => {
        if (!Array.isArray(informes)) return [];

        return informes.filter((i) => {
            const coincideNombre = i.titulo?.toLowerCase().includes(filtros.nombre.toLowerCase());
            const coincideEstado = filtros.estado ? i.estado === filtros.estado : true;
            return coincideNombre && coincideEstado;
        });
    }, [informes, filtros]);

    if (loading && informes.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 font-medium italic">Sincronizando registros del Patronato...</p>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans animate-in fade-in duration-500">

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Módulo Patronato</h2>
                    <p className="text-sm text-gray-500 font-medium">Historial y Actualización de Informes Económicos</p>
                </div>
                <button
                    className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:scale-95 uppercase text-xs"
                    onClick={handleModalForm}
                >
                    <span className="text-lg mr-2">+</span> Subir Nuevo Informe
                </button>
            </div>

            {form && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <InformeEconomicoForm
                        ejecutarSubida={ejecutarSubida}
                        handleModalForm={handleModalForm}
                        object={object}
                        setInformation={setInformation}
                    />
                </div>
            )}

            {/* Barra de Búsqueda */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
                <div className="flex-1 min-w-[200px] relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Buscar por título de informe..."
                        value={filtros.nombre}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                </div>
            </div>

            {/* Contenedor de Tabla */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                {informesFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <span className="text-6xl mb-4 opacity-20">📊</span>
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            No se registran informes<br />bajo estos criterios
                        </h2>
                    </div>
                ) : (
                    <Paginador items={informesFiltrados} itemsPorPagina={8}>
                        {(itemsPaginados) => (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-50">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado de Versión</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsable</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {itemsPaginados.map((i) => (
                                            <tr key={i.id} className="hover:bg-indigo-50/30 transition-all duration-200 group">
                                                <td className="px-8 py-5">
                                                    <div className="text-sm font-bold text-gray-800 tracking-tight">{i.titulo}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-black uppercase">
                                                            {i.documento?.extension || 'DOC'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium tracking-tighter">
                                                            {i.documento?.tamaño_legible}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tighter">
                                                            VERSIÓN {i.documento?.version || 1}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium italic">
                                                            Subido el {new Date(i.fecha_creacion).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-[10px] font-black text-gray-500 shadow-inner">
                                                            {i.responsable_nombre?.charAt(0)}
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-700 tracking-tight">
                                                            {i.responsable_nombre}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center gap-3">
                                                        <BtnDescargar
                                                            onClick={() => {
                                                                const url = i.documento.url_descarga;
                                                                console.log(i)
                                                                const link = document.createElement('a');
                                                                link.href = url;

                                                                link.target = "_blank";
                                                                link.rel = "noopener noreferrer";

                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            }}
                                                            title="Descargar Informe"
                                                        />

                                                        <button
                                                            onClick={() => handleReemplazar(i)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all shadow-sm shadow-amber-100 border border-amber-100"
                                                        >
                                                            <span className="text-xs">🔄</span>
                                                            <span className="text-[10px] font-black uppercase tracking-tight">Actualizar</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Paginador>
                )}
            </div>

            {/* Notificaciones de Feedback */}
            {information && <Toast information={information} setInformation={setInformation} />}
            {error && <Toast information={error} setInformation={limpiarError} type="error" />}
        </div>
    );
}