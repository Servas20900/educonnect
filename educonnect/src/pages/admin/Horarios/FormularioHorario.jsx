import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import CustomSelect from "../../../components/ui/CustomSelect";

const FormularioHorario = ({ 
    uploading, 
    crearHorario, 
    handleModalForm, 
    object, 
    actualizarHorario, 
    usuarios, 
    grupos, 
    asignaturas 
}) => {
    const [docentesOptions, setDocentesOptions] = useState([]);
    const [gruposOptions, setGruposOptions] = useState([]);
    const [asignaturaOptions, setAsignaturaOptions] = useState([]);

    const { register, handleSubmit, control, formState: { errors }, watch } = useForm({
        defaultValues: {
            nombre: object?.nombre || "",
            tipo_horario: object?.tipo_horario || "Presencial",
            estado: object?.estado || "Borrador",
            notas: object?.notas || "",
            grupo: object?.grupo || "",
            docente: object?.docente_info?.id || "",
            version: object?.version || 1,
            dia_semana: object?.detalles?.[0]?.dia_semana || "Lunes",
            hora_inicio: object?.detalles?.[0]?.hora_inicio || "", 
            hora_fin: object?.detalles?.[0]?.hora_fin || "",
            aula: object?.detalles?.[0]?.aula || "",
            asignatura: object?.detalles?.[0]?.asignatura || "",
        }
    });

    useEffect(() => {
        if (usuarios) {
            const docentes = usuarios
                .filter(u => u.rol?.nombre === "docente")
                .map(u => ({
                    value: u.id,
                    label: u.persona ? `${u.persona.nombre} ${u.persona.primer_apellido}` : u.username
                }));
            setDocentesOptions(docentes);
        }
        if (grupos) setGruposOptions(grupos.map(g => ({ value: g.id, label: g.label })));
        if (asignaturas) setAsignaturaOptions(asignaturas.map(a => ({ value: a.id, label: a.label })));
    }, [usuarios, grupos, asignaturas]);

    const onSubmitHandler = (data) => {
        const { dia_semana, hora_inicio, hora_fin, aula, asignatura, ...cabecera } = data;
        const dataFinal = {
            ...cabecera,
            version: object?.id ? (parseInt(object.version) + 1) : 1,
            detalles: [{
                dia_semana,
                hora_inicio,
                hora_fin,
                aula,
                asignatura: parseInt(asignatura),
                docente: parseInt(cabecera.docente)
            }]
        };
        object?.id ? actualizarHorario(dataFinal, object.id) : crearHorario(dataFinal);
    };

    // Estilo unificado de inputs basado en tu FormularioCircular
    const inputClasses = (error) => `
        w-full rounded-md border px-3 py-2 text-slate-900 transition-all outline-none text-sm
        ${error 
            ? "border-red-500 focus:ring-2 focus:ring-red-100" 
            : "border-slate-300 focus:border-[#185fa5] focus:ring-2 focus:ring-[#e6f1fb]"
        }
    `;

    return (
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
            {/* SECCIÓN: DATOS GENERALES */}
            <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Información General</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Nombre del Horario</label>
                        <input
                            type="text"
                            className={inputClasses(errors.nombre)}
                            placeholder="Ej: Horario 10-1 Matemáticas"
                            {...register("nombre", { required: "El nombre es obligatorio" })}
                        />
                        {errors.nombre && <p className="text-xs text-red-500 font-medium">{errors.nombre.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Modalidad</label>
                        <select className={inputClasses()} {...register("tipo_horario")}>
                            <option value="Presencial">Presencial</option>
                            <option value="Virtual">Virtual</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Docente Principal</label>
                        <CustomSelect
                            name="docente"
                            control={control}
                            options={docentesOptions}
                            placeholder="Seleccionar docente..."
                            rules={{ required: "Requerido" }}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Grupo Asignado</label>
                        <CustomSelect
                            name="grupo"
                            control={control}
                            options={gruposOptions}
                            placeholder="Seleccionar grupo..."
                            rules={{ required: "Requerido" }}
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN: DETALLES DEL BLOQUE */}
            <div className="space-y-4 pt-2">
                <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalle de la Lección</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Día</label>
                        <select className={inputClasses()} {...register("dia_semana")}>
                            {["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Hora Inicio</label>
                        <input type="time" className={inputClasses()} {...register("hora_inicio", { required: true })} />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Hora Fin</label>
                        <input type="time" className={inputClasses()} {...register("hora_fin", { required: true })} />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Aula</label>
                        <input type="text" className={inputClasses()} placeholder="Ej: Laboratorio 1" {...register("aula")} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Asignatura</label>
                        <CustomSelect
                            name="asignatura"
                            control={control}
                            options={asignaturaOptions}
                            placeholder="Seleccionar materia..."
                            rules={{ required: "Requerido" }}
                        />
                    </div>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                    type="button"
                    onClick={handleModalForm}
                    className="px-4 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2 rounded-md bg-[#185fa5] text-sm font-medium text-white hover:bg-[#0b2545] transition-colors disabled:opacity-50"
                >
                    {uploading ? "Guardando..." : object?.id ? "Actualizar Horario" : "Guardar Horario"}
                </button>
            </div>
        </form>
    );
};

export default FormularioHorario;