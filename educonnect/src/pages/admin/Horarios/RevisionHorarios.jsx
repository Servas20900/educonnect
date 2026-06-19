import PopUp from "../../../components/ui/PopUp";
import { RenderVer } from "./RenderVer";
import { useRevisionHorarios } from "./hooks/useRevisionHorarios";
import { useState } from "react";
import { DataTable, BtnVer, BtnAprobar, BtnRechazar, BtnEditar, BtnArchivar, BtnReactivar } from '../../../components/ui';
import useSystemConfig from '../../../hooks/useSystemConfig';
const RevisionHorarios = ({ horarios, deleteHorario, onEdit, actualizarHorario }) => {
    const { getCatalog } = useSystemConfig();
    const horariosEstados = getCatalog('horarios_estados', [
        { value: 'Publicado', label: 'Publicado' },
        { value: 'Borrador', label: 'Borrador' },
        { value: 'Inactivo', label: 'Inactivo' },
    ]);

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
            message: `Se aprobara el horario "${horarioSeleccionado?.nombre || ""}".`,
            confirmText: "Aprobar",
            onConfirm: () => handleConfirm()
        },
        Rechazar: {
            title: "Rechazar horario",
            message: `Se rechazara el horario "${horarioSeleccionado?.nombre || ""}" y volvera a borrador.`,
            confirmText: "Rechazar",
            onConfirm: () => handleConfirm("Rechazado por administracion")
        },
        Eliminar: {
            title: "Archivar horario",
            message: `Se archivara el horario "${horarioSeleccionado?.nombre || ""}".`,
            confirmText: "Archivar",
            onConfirm: handleDelete
        },
        Reactivar: {
            title: "Reactivar horario",
            message: `Se reactivara el horario "${horarioSeleccionado?.nombre || ""}".`,
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
                        {accion === "Ver" && <RenderVer horario={horarioSeleccionado} />}
                        {activeConfirmConfig && accion !== "Ver" && (
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">{activeConfirmConfig.title}</h2>
                                <p className="text-sm text-gray-600 mb-5">{activeConfirmConfig.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg border border-gray-200">Cancelar</button>
                                    {accion === "Aprobar" && <BtnAprobar onClick={activeConfirmConfig.onConfirm} />}
                                    {accion === "Rechazar" && <BtnRechazar onClick={activeConfirmConfig.onConfirm} />}
                                    {accion === "Reactivar" && <BtnReactivar onClick={activeConfirmConfig.onConfirm} />}
                                    {accion === "Eliminar" && <BtnArchivar onClick={activeConfirmConfig.onConfirm} />}
                                </div>
                            </div>
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
                    {horariosEstados.map((estado) => (
                        <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                </select>
            </div>
            <DataTable
                pageSize={6}
                data={horariosFiltrados}
                emptyMessage="No hay horarios para los filtros seleccionados."
                columns={[
                    {
                        key: 'nombre',
                        label: 'Horario',
                        render: (horario) => (
                            <div>
                                <div className="text-sm font-bold text-slate-800">{horario.nombre}</div>
                                <div className="text-xs text-slate-400 uppercase mt-0.5">Ref: #{horario.id}</div>
                            </div>
                        ),
                    },
                    {
                        key: 'docente',
                        label: 'Docente Responsable',
                        render: (horario) => (
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-[10px]">
                                    {horario.docente_info?.nombre?.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold text-slate-600">{horario.docente_info?.nombre}</span>
                            </div>
                        ),
                    },
                    {
                        key: 'estado',
                        label: 'Estado',
                        render: (horario) => (
                            <span className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full ring-1 ring-inset ${getStatusStyles(horario.estado)}`}>
                                {horario.estado.toUpperCase()}
                            </span>
                        ),
                    },
                    {
                        key: 'gestion',
                        label: 'Gestión',
                        render: (horario) => (
                            <div className="flex items-center justify-end gap-2">
                                <BtnVer onClick={() => handleOption("Ver", horario)} />
                                {horario.estado !== "Inactivo" ? (
                                    horario.estado !== "Publicado" ? (
                                        <>
                                            <BtnAprobar onClick={() => handleOption("Aprobar", horario)} />
                                            <BtnRechazar onClick={() => handleOption("Rechazar", horario)} />
                                        </>
                                    ) : (
                                        <>
                                            <BtnEditar onClick={() => onEdit(horario)} />
                                            <BtnArchivar onClick={() => handleOption("Eliminar", horario)} />
                                        </>
                                    )
                                ) : (
                                    <BtnReactivar onClick={() => handleOption("Reactivar", horario)} />
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
};
export default RevisionHorarios;