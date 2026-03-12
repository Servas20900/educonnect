import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import CustomSelect from '../../../components/ui/CustomSelect';
import useHorarioEstudiante from './hooks/useHorarioEstudiante';
import Paginador from '../../../components/ui/Paginador';

export default function ConsultaHorarios() {
    const {
        loading,
        HorarioExistentes,
        cargarHorario,
        personas,
        cargarCatalogosReunion,
        loadingPersonas
    } = useHorarioEstudiante();

    useEffect(() => {
        cargarHorario();
        cargarCatalogosReunion();
    }, [cargarHorario, cargarCatalogosReunion]);

    const { control, watch } = useForm({
        defaultValues: {
            profesor: null,
            grupo: null
        }
    });

    const filtroProfesor = watch("profesor");
    const filtroGrupo = watch("grupo");

    const optionsProfesores = useMemo(() => {
        if (!Array.isArray(personas)) return [];
        return personas
            .filter(p => p?.rol?.nombre === "docente")
            .map(p => ({
                value: p.id, 
                label: p.persona 
                    ? `${p.persona.nombre} ${p.persona.primer_apellido || ''}` 
                    : p.username
            }));
    }, [personas]);

    const optionsGrupos = useMemo(() => {
        if (!Array.isArray(HorarioExistentes)) return [];
        const gruposUnicos = [...new Set(HorarioExistentes.map(h => h.grupo))];
        return gruposUnicos
            .filter(Boolean)
            .map(g => ({ value: g, label: `Grupo ${g}` }));
    }, [HorarioExistentes]);

    const horariosFiltrados = useMemo(() => {
        if (!Array.isArray(HorarioExistentes)) return [];

        return HorarioExistentes.filter((item) => {
            const idFiltroProfesor = filtroProfesor?.value !== undefined ? filtroProfesor.value : filtroProfesor;
            const idFiltroGrupo = filtroGrupo?.value !== undefined ? filtroGrupo.value : filtroGrupo;

            const coincideProfesor = !idFiltroProfesor || String(item.docente_info?.id) === String(idFiltroProfesor);
            const coincideGrupo = !idFiltroGrupo || String(item.grupo) === String(idFiltroGrupo);

            return coincideProfesor && coincideGrupo;
        });
    }, [HorarioExistentes, filtroProfesor, filtroGrupo]);

    if (loading || loadingPersonas) {
        return (
            <div className="flex flex-col justify-center items-center p-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Sincronizando información académica...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Docente Responsable</label>
                    <CustomSelect
                        name="profesor"
                        control={control}
                        options={optionsProfesores}
                        placeholder="Todos los docentes"
                        isMulti={false}
                        isClearable={true}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Grupo / Sección</label>
                    <CustomSelect
                        name="grupo"
                        control={control}
                        options={optionsGrupos}
                        placeholder="Todos los grupos"
                        isMulti={false}
                        isClearable={true}
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100/50">
                <Paginador items={horariosFiltrados} itemsPorPagina={4}>
                    {(itemsPaginados) => (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead>
                                    <tr className="bg-gray-50/30">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronograma</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Información de Curso</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Docente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {itemsPaginados.length > 0 ? (
                                        itemsPaginados.map((item) => (
                                            <tr key={item.id} className="group hover:bg-purple-50/40 transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    {item.detalles?.map(d => (
                                                        <div key={d.id} className="mb-2 last:mb-0">
                                                            <span className="block text-xs font-black text-purple-700 uppercase tracking-tighter">{d.dia_semana}</span>
                                                            <span className="text-sm font-medium text-gray-500">
                                                                {d.hora_inicio?.slice(0, 5)} - {d.hora_fin?.slice(0, 5)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-black text-gray-800 uppercase tracking-tight leading-none mb-2">{item.nombre}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-500 rounded-md">G{item.grupo}</span>
                                                        <span className="px-2 py-0.5 bg-purple-100 text-[9px] font-bold text-purple-600 rounded-md uppercase tracking-tighter">{item.tipo_horario}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-purple-100 transition-transform group-hover:scale-110">
                                                            {item.docente_info?.nombre?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div className="text-sm font-bold text-gray-700">{item.docente_info?.nombre || "No asignado"}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-8 py-32 text-center">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No hay registros para este criterio</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Paginador>
            </div>
        </div>
    );
}