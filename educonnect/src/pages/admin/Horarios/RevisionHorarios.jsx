import PopUp from "../../../../components/PopUp";
import { RenderAprobar } from "./RenderAprobar";
import { RenderVer } from "./RenderVer";
import { RenderRechazo } from "./RenderRechazo";
import { RenderDelete } from "./RenderDelete";
import { RenderReactivar } from "./RenderReactivar";
import { useRevisionHorarios } from "./hooks/useRevisionHorarios";
import { useState } from "react";
import Paginador from '../../../components/ui/Paginador';  
import { 
    BtnVer, 
    BtnEditar, 
    BtnAprobar, 
    BtnRechazar, 
    BtnArchivar, 
    BtnReactivar 
} from "../../../components/ui/ActionButtons";

const RevisionHorarios = ({ horarios, deleteHorario, onEdit, actualizarHorario }) => {
    const {
        modal,
        accion,
        horarioSeleccionado,
        handleOption,
        closeModal,
        handleConfirm,
        handleDelete
    } = useRevisionHorarios(horarios, actualizarHorario, deleteHorario);

    const getStatusStyles = (estado) => {
        const styles = {
            'Publicado': 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
            'Borrador': 'bg-amber-100 text-amber-700 ring-amber-600/20',
            'Inactivo': 'bg-slate-100 text-slate-600 ring-slate-600/10',
        };
        return styles[estado] || 'bg-gray-100 text-gray-600 ring-gray-600/10';
    };

    const [filtros, setFiltros] = useState({ nombre: "", docente: "", estado: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros({ ...filtros, [name]: value });
    };

    const horariosFiltrados = horarios.filter((horario) => {
        const coincideNombre = horario.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
        const coincideDocente = horario.docente_info.nombre.toLowerCase().includes(filtros.docente.toLowerCase());
        const coincideEstado = filtros.estado ? horario.estado === filtros.estado : true;
        return coincideNombre && coincideDocente && coincideEstado;
    });

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <PopUp isModalOpen={modal} closeModal={closeModal}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-1">
                    {accion === "Aprobar" && <RenderAprobar nombre={horarioSeleccionado?.nombre} onConfirm={handleConfirm} onCancel={closeModal} />}
                    {accion === "Ver" && <RenderVer horario={horarioSeleccionado} />}
                    {accion === "Rechazar" && <RenderRechazo onConfirm={handleConfirm} onCancel={closeModal} />}
                    {accion === "Eliminar" && <RenderDelete nombre={horarioSeleccionado?.nombre} onDelete={handleDelete} onCancel={closeModal} />}
                    {accion === "Reactivar" && <RenderReactivar nombre={horarioSeleccionado?.nombre} onConfirm={handleConfirm} onCancel={closeModal} />}
                </div>
            </PopUp>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Buscar horario..."
                        value={filtros.nombre}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        name="docente"
                        placeholder="Buscar docente..."
                        value={filtros.docente}
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
                <Paginador items={horariosFiltrados} itemsPorPagina={6}>
                    {(itemsPaginados) => (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Horario</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Docente</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                        <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {itemsPaginados.map((horario) => (
                                        <tr key={horario.id} className="hover:bg-indigo-50/40 transition-colors duration-200">
                                            <td className="px-8 py-5 font-bold text-gray-800 text-sm">{horario.nombre}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-[10px]">
                                                        {horario.docente_info?.nombre?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">{horario.docente_info?.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full ring-1 ring-inset ${getStatusStyles(horario.estado)}`}>
                                                    {horario.estado.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center gap-3">
                                                    <BtnVer onClick={() => handleOption("Ver", horario)} />
                                                    
                                                    {horario.estado === "Inactivo" ? (
                                                        <>
                                                            <BtnEditar onClick={() => onEdit(horario)} />
                                                            <BtnReactivar onClick={() => handleOption("Reactivar", horario)} />
                                                        </>
                                                    ) : horario.estado === "Publicado" ? (
                                                        <>
                                                            <BtnEditar onClick={() => onEdit(horario)} />
                                                            <BtnArchivar onClick={() => handleOption("Eliminar", horario)} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BtnAprobar onClick={() => handleOption("Aprobar", horario)} />
                                                            <BtnRechazar onClick={() => handleOption("Rechazar", horario)} />
                                                        </>
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
            </div>
        </div>
    );
};

export default RevisionHorarios;