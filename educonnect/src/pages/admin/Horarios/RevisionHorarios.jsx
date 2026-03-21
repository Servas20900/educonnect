import PopUp from "../../../../components/PopUp";
import { RenderVer } from "./RenderVer";
import { useRevisionHorarios } from "./hooks/useRevisionHorarios";
import { useState } from "react";
import Paginador from '../../../components/ui/Paginador'
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

    const confirmModalConfig = {
        Aprobar: {
            title: "Aprobar horario",
            message: `Se aprobara el horario \"${horarioSeleccionado?.nombre || ""}\".`,
            confirmText: "Aprobar",
            onConfirm: () => handleConfirm()
        },
        Rechazar: {
            title: "Rechazar horario",
            message: `Se rechazara el horario \"${horarioSeleccionado?.nombre || ""}\" y volvera a borrador.`,
            confirmText: "Rechazar",
            onConfirm: () => handleConfirm("Rechazado por administracion")
        },
        Eliminar: {
            title: "Archivar horario",
            message: `Se archivara el horario \"${horarioSeleccionado?.nombre || ""}\".`,
            confirmText: "Archivar",
            onConfirm: handleDelete
        },
        Reactivar: {
            title: "Reactivar horario",
            message: `Se reactivara el horario \"${horarioSeleccionado?.nombre || ""}\".`,
            confirmText: "Reactivar",
            onConfirm: () => handleConfirm("Reactivado por administracion")
        }
    };

    const activeConfirmConfig = confirmModalConfig[accion];



    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
            <PopUp isModalOpen={modal} closeModal={closeModal}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-1">
                        {accion === "Aprobar" && (
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">{activeConfirmConfig?.title}</h2>
                                <p className="text-sm text-gray-600 mb-5">{activeConfirmConfig?.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg border border-gray-200">Cancelar</button>
                                    <button onClick={activeConfirmConfig?.onConfirm} className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700">
                                        {activeConfirmConfig?.confirmText}
                                    </button>
                                </div>
                            </div>
                        )}
                        {accion === "Ver" && <RenderVer horario={horarioSeleccionado} />}
                        {accion === "Rechazar" && activeConfirmConfig && (
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">{activeConfirmConfig.title}</h2>
                                <p className="text-sm text-gray-600 mb-5">{activeConfirmConfig.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg border border-gray-200">Cancelar</button>
                                    <button onClick={activeConfirmConfig.onConfirm} className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-rose-600 hover:bg-rose-700">
                                        {activeConfirmConfig.confirmText}
                                    </button>
                                </div>
                            </div>
                        )}
                        {accion === "Eliminar" && activeConfirmConfig && (
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">{activeConfirmConfig.title}</h2>
                                <p className="text-sm text-gray-600 mb-5">{activeConfirmConfig.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg border border-gray-200">Cancelar</button>
                                    <button onClick={activeConfirmConfig.onConfirm} className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-slate-600 hover:bg-slate-700">
                                        {activeConfirmConfig.confirmText}
                                    </button>
                                </div>
                            </div>
                        )}
                        {accion === "Reactivar" && activeConfirmConfig && (
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">{activeConfirmConfig.title}</h2>
                                <p className="text-sm text-gray-600 mb-5">{activeConfirmConfig.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg border border-gray-200">Cancelar</button>
                                    <button onClick={activeConfirmConfig.onConfirm} className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700">
                                        {activeConfirmConfig.confirmText}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PopUp>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative z-0flex-1 min-w-[200px]">
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
            <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm bg-white">
                <Paginador items={horariosFiltrados} itemsPorPagina={6}>
                    {(itemsPaginados) => (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Horario</th>
                                        <th className="px-8 py-5 text-left">Docente Responsable</th>
                                        <th className="px-8 py-5 text-left">Estado</th>
                                        <th className="px-8 py-5 text-center">Gestión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {itemsPaginados.map((horario) => (
                                        <tr key={horario.id} className="hover:bg-indigo-50/30 transition-colors duration-200">
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-gray-800">{horario.nombre}</div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase mt-0.5">Ref: #{horario.id}</div>
                                            </td>
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
                                                <div className="flex items-center justify-center gap-4 min-w-[200px]">
                                                    <button onClick={() => handleOption("Ver", horario)} className="text-[11px] font-black text-blue-600 hover:text-blue-800">
                                                        VER
                                                    </button>
                                                    <div className="h-4 w-[1px] bg-gray-200" />
                                                    {horario.estado !== "Inactivo" ? (
                                                        <div className="flex gap-3">
                                                            {horario.estado !== "Publicado" ? (
                                                                <>
                                                                    <button onClick={() => handleOption("Aprobar", horario)} className="text-[11px] font-black text-emerald-600">APROBAR</button>
                                                                    <button onClick={() => handleOption("Rechazar", horario)} className="text-[11px] font-black text-rose-500">RECHAZAR</button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => onEdit(horario)} className="text-[11px] font-black text-indigo-600">EDITAR</button>
                                                                    <button onClick={() => handleOption("Eliminar", horario)} className="text-[11px] font-black text-slate-500">ARCHIVAR</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleOption("Reactivar", horario)} className="text-[11px] font-black text-emerald-600">REACTIVAR</button>
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