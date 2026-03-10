import { useEffect, useState } from 'react';
import { useCirculares } from "./Circulares/hooks/useCirculares";
import FormularioCircular from './Circulares/FormularioCircular';
import Toast from '../../../components/Toast';
import PopUp from '../../../components/PopUp';
import Paginador from '../../components/ui/Paginador';
import { 
    BtnEditar, 
    BtnReactivar, 
    BtnDesactivar 
} from "../../components/ui/ActionButtons";

export default function CircularesList() {
    const { cargarCirculares, circularesExistentes, loading, error, uploading, errorUploading, crearCircular, actualizarCircular, eliminarCircular } = useCirculares();
    const [form, setForm] = useState(false);
    const [object, setObject] = useState({});
    const [modal, setModal] = useState(false);
    const [information, setInformation] = useState("");
    const [idToDelete, setIdToDelete] = useState(null);
    const [archivar, setArchivar] = useState("");
    const [filtros, setFiltros] = useState({ nombre: "", estado: "" });

    useEffect(() => {
        cargarCirculares();
    }, [cargarCirculares]);

    const handleModalForm = () => {
        setForm(!form);
        setObject({});
    };

    const handleEdit = (circular) => {
        setObject(circular);
        setForm(!form);
    };

    const openDeleteModal = (circular) => {
        const estado = circular.estado !== "Inactivo" ? "desactivar" : "activar";
        setArchivar(estado);
        setIdToDelete(circular.id);
        setModal(true);
    };

    const confirmDelete = async () => {
        try {
            await eliminarCircular(idToDelete);
            setInformation("Se logró con éxito");
        } catch (err) {
            setInformation("Hubo un fallo");
        } finally {
            setModal(false);
            setIdToDelete(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros({ ...filtros, [name]: value });
    };

    const circularesFiltradas = circularesExistentes.filter((circular) => {
        const coincideNombre = circular.titulo.toLowerCase().includes(filtros.nombre.toLowerCase());
        const coincideEstado = filtros.estado ? circular.estado === filtros.estado : true;
        return coincideNombre && coincideEstado;
    });

    const getStatusStyles = (estado) => {
        const styles = {
            'Publicado': 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
            'Borrador': 'bg-amber-100 text-amber-700 ring-amber-600/20',
            'Inactivo': 'bg-slate-100 text-slate-600 ring-slate-600/10',
        };
        return styles[estado] || 'bg-gray-100 text-gray-600 ring-gray-600/10';
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Cargando circulares...</p>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <PopUp closeModal={() => setModal(false)} isModalOpen={modal}>
                <div className="p-8 text-center bg-white rounded-2xl shadow-xl max-w-sm mx-auto">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${archivar === 'activar' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <span className="text-2xl">{archivar === 'activar' ? '✅' : '⚠️'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-tight">¿Confirmar acción?</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Estás a punto de <span className="font-bold text-gray-800">{archivar}</span> esta circular.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setModal(false)} className="px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancelar</button>
                        <button onClick={confirmDelete} className={`px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all ${archivar === 'activar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Sí, {archivar}</button>
                    </div>
                </div>
            </PopUp>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight uppercase">Circulares</h2>
                <button
                    className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:scale-95"
                    onClick={handleModalForm}
                >
                    <span className="text-xl mr-2">+</span> Nueva Circular
                </button>
            </div>

            {form && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <FormularioCircular
                        uploading={uploading}
                        errorUploading={errorUploading}
                        crearCircular={crearCircular}
                        handleModalForm={handleModalForm}
                        object={object}
                        actualizarCircular={actualizarCircular}
                        setInformation={setInformation}
                    />
                </div>
            )}

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Buscar por título..."
                        value={filtros.nombre}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                </div>
                <select
                    name="estado"
                    value={filtros.estado}
                    onChange={handleChange}
                    className="py-2.5 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-600 cursor-pointer"
                >
                    <option value="">Todos los estados</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {circularesFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <span className="text-5xl mb-4">📂</span>
                        <h2 className="text-xl font-bold text-gray-800">No hay resultados</h2>
                    </div>
                ) : (
                    <Paginador items={circularesFiltradas} itemsPorPagina={6}>
                        {(itemsPaginados) => (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Contenido</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Programación</th>
                                            <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {itemsPaginados.map((circular) => (
                                            <tr key={circular.id} className="hover:bg-indigo-50/40 transition-colors duration-200">
                                                <td className="px-8 py-5 text-sm font-bold text-gray-800">{circular.titulo}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full ring-1 ring-inset ${getStatusStyles(circular.estado)}`}>
                                                        {circular.estado.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-gray-500 font-medium">
                                                    <span>📅</span> {circular.fecha_vigencia_inicio || 'Inmediata'}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center gap-3">
                                                        <BtnEditar 
                                                            onClick={() => handleEdit(circular)} 
                                                            disabled={form} 
                                                        />
                                                        {circular.estado === "Inactivo" ? (
                                                            <BtnReactivar onClick={() => openDeleteModal(circular)} />
                                                        ) : (
                                                            <BtnDesactivar onClick={() => openDeleteModal(circular)} />
                                                        )}
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
            {information && <Toast information={information} setInformation={setInformation} />}
        </div>
    );
}