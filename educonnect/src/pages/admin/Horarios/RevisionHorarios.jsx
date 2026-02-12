import PopUp from "../../../../components/PopUp";
import { RenderAprobar } from "./RenderAprobar";
import { RenderVer } from "./RenderVer";
import { RenderRechazo } from "./RenderRechazo";
import { RenderDelete } from "./RenderDelete";
import { RenderReactivar } from "./RenderReactivar";
import { useRevisionHorarios } from "./hooks/useRevisionHorarios";
import { useState } from "react";

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

    const [filtros, setFiltros] = useState({
        nombre: "",
        docente: "",
        estado: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros({ ...filtros, [name]: value });
    };

    const horariosFiltrados = horarios.filter((horario) => {
        const coincideNombre = horario.nombre
            .toLowerCase()
            .includes(filtros.nombre.toLowerCase());

        const coincideDocente = horario.docente_info.nombre
            .toLowerCase()
            .includes(filtros.docente.toLowerCase());


        const coincideEstado = filtros.estado
            ? horario.estado === filtros.estado
            : true;

        return coincideNombre && coincideDocente && coincideEstado;
    });



    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
            <PopUp isModalOpen={modal} closeModal={closeModal}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-1">
                        {accion === "Aprobar" && (
                            <RenderAprobar
                                nombre={horarioSeleccionado?.nombre}
                                onConfirm={handleConfirm}
                                onCancel={closeModal}
                            />
                        )}
                        {accion === "Ver" && <RenderVer horario={horarioSeleccionado} />}
                        {accion === "Rechazar" && (
                            <RenderRechazo
                                onConfirm={handleConfirm}
                                onCancel={closeModal}
                            />
                        )}
                        {accion === "Eliminar" && (
                            <RenderDelete
                                nombre={horarioSeleccionado?.nombre}
                                onDelete={handleDelete}
                                onCancel={closeModal}
                            />
                        )}
                        {accion === "Reactivar" && (
                            <RenderReactivar
                                nombre={horarioSeleccionado?.nombre}
                                onConfirm={handleConfirm}
                                onCancel={closeModal}
                            />
                        )}
                    </div>
                </div>
            </PopUp>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Buscar horario..."
                        value={filtros.nombre}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                    <input
                        type="text"
                        name="docente"
                        placeholder="Buscar docente..."
                        value={filtros.docente}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                </div>
                <select
                    name="estado"
                    value={filtros.estado}
                    onChange={handleChange}
                    className="py-2 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-600 cursor-pointer"
                >
                    <option value="">Todos los estados</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-widest">
                    <tr>
                        <th className="px-6 py-4 text-left">Horario</th>
                        <th className="px-6 py-4 text-left">Docente</th>
                        <th className="px-6 py-4 text-left">Estado</th>
                        <th className="px-6 py-4 text-center">Gestión</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {horariosFiltrados.map((horario) => (
                        <tr key={horario.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-gray-800">{horario.nombre}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                        {horario.docente_info?.nombre?.charAt(0)}
                                    </div>
                                    {horario.docente_info?.nombre}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${getStatusStyles(horario.estado)}`}>
                                    {horario.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-4 min-w-[200px]">
                                    <button onClick={() => handleOption("Ver", horario)} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                        VER
                                    </button>
                                    <div className="h-4 w-[1px] bg-gray-200" />
                                    {horario.estado !== "Inactivo" ? (
                                        <div className="flex gap-3">
                                            {horario.estado !== "Publicado" ? (
                                                <>
                                                    <button onClick={() => handleOption("Aprobar", horario)} className="text-xs font-bold text-emerald-600">APROBAR</button>
                                                    <button onClick={() => handleOption("Rechazar", horario)} className="text-xs font-bold text-rose-500">RECHAZAR</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => onEdit(horario)} className="text-xs font-bold text-indigo-600">EDITAR</button>
                                                    <button onClick={() => handleOption("Eliminar", horario)} className="text-xs font-bold text-slate-500">ARCHIVAR</button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <button onClick={() => handleOption("Reactivar", horario)} className="text-xs font-bold text-emerald-600">REACTIVAR</button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RevisionHorarios;