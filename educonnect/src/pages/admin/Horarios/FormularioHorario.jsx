import { useForm } from "react-hook-form";

const FormularioHorario = ({ uploading, errorUploading, crearHorario, handleModalForm, object, actualizarHorario }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            nombre: object.nombre || "",
            tipo_horario: object.tipo_horario || "Presencial",
            estado: object.estado || "Borrador",
            notas: object.notas || "",
            grupo: object.grupo || "",
            docente: object.docente || "",
            version: object.version || 1,
            dia_semana: "Lunes",
            hora_inicio: "",
            hora_fin: "",
            aula: "",
            asignatura: "",
            docente_detalle: ""
        }
    });

    const onSubmitHandler = (data) => {
        const { dia_semana, hora_inicio, hora_fin, aula, asignatura, docente_detalle, ...cabecera } = data;

        const dataFinal = {
            ...cabecera,
            version: object.id ? (parseInt(object.version) + 1) : 1,
            detalles: [
                {
                    dia_semana,
                    hora_inicio: hora_inicio.length === 5 ? `${hora_inicio}` : hora_inicio,
                    hora_fin: hora_fin.length === 5 ? `${hora_fin}` : hora_fin,
                    aula,
                    asignatura: parseInt(asignatura),
                    docente: parseInt(docente_detalle || cabecera.docente)
                }
            ],
            aprobaciones: []
        };

        console.log(dataFinal)

        if (object.id) {
            actualizarHorario(object.id, dataFinal);
        } else {
            crearHorario(dataFinal);
        }
    };

    const inputClasses = (error) => `
        block w-full rounded-xl border transition-all duration-200 outline-none p-2.5 text-sm
        ${error
            ? 'border-red-400 bg-red-50 focus:ring-4 focus:ring-red-100'
            : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
        }
    `;

    return (
        <div >
            <div className=" px-6 flex justify-between mb-4">
                <h2 className="text-2xl font-bold ">
                    {object.id ? "Editar Horario" : "Crear Nuevo Horario"}
                </h2>
                <button onClick={handleModalForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmitHandler)} className="p-8 space-y-10">

                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Datos Generales</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Nombre del Horario</label>
                            <input
                                type="text"
                                className={inputClasses(errors.nombre)}
                                placeholder="Ej: Horario Matemáticas 2026"
                                {...register("nombre", { required: "El nombre es obligatorio" })}
                            />
                            {errors.nombre && <p className="text-xs text-red-500 mt-1 ml-1">{errors.nombre.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Tipo de Horario</label>
                            <select className={inputClasses()} {...register("tipo_horario")}>
                                <option value="Presencial">Presencial</option>
                                <option value="Virtual">Virtual</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Docente Principal</label>
                            {/* Aca va un fetch de PersonasDocente */}
                            <select className={inputClasses(errors.docente)} {...register("docente", { required: "Requerido" })}>
                                <option value="">Seleccione un docente...</option>
                                <option value="1">Docente A</option>
                                <option value="2">Docente B</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Grupo</label>
                            {/* Aca va un fetch de AcademicoGrupo */}
                            <select className={inputClasses(errors.grupo)} {...register("grupo", { required: "Requerido" })}>
                                <option value="">Seleccione un grupo...</option>
                                <option value="1">Grupo A</option>
                                <option value="2">Grupo B</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Primer Bloque de Clase</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1 md:col-span-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Día de la semana</label>
                            <select className={inputClasses()} {...register("dia_semana")}>
                                <option value="Lunes">Lunes</option>
                                <option value="Martes">Martes</option>
                                <option value="Miercoles">Miércoles</option>
                                <option value="Jueves">Jueves</option>
                                <option value="Viernes">Viernes</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Hora Inicio</label>
                            <input type="time" className={inputClasses()} {...register("hora_inicio")} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Hora Fin</label>
                            <input type="time" className={inputClasses()} {...register("hora_fin")} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Aula / Salón</label>
                            <input type="text" className={inputClasses()} placeholder="Ej: 302-B" {...register("aula")} />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Asignatura</label>
                            {/* Aca va un fetch de AcademicoAsignatura */}
                            <select className={inputClasses(errors.asignatura)} {...register("asignatura", { required: "Requerido" })}>
                                <option value="">Seleccione una asignatura...</option>
                                <option value="1">Ciencias</option>
                                <option value="2">Matematica</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleModalForm}
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={uploading}
                        type="submit"
                        className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:bg-gray-300 disabled:shadow-none"
                    >
                        {uploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Guardando...
                            </span>
                        ) : "Confirmar y Guardar"}
                    </button>
                </div>

                {errorUploading && (
                    <p className="text-center text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                        Ocurrió un error al procesar la solicitud. Por favor, intente de nuevo.
                    </p>
                )}
            </form>
        </div>
    );
};

export default FormularioHorario