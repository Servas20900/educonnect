import { useForm } from "react-hook-form";

export default function InformeEconomicoForm({ ejecutarSubida, handleModalForm, object, setInformation }) {
    const isReemplazo = !!object?.id;
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: { titulo: object?.titulo || "" }
    });

    const archivoSeleccionado = watch("archivo");


    const onSubmit = async (data) => {
        try {
            const payload = {
                titulo: data.titulo,
                periodo: data.periodo,
                archivo: data.archivo[0],
                reemplazarId: object?.id || null
            };
            await ejecutarSubida(payload);
            setInformation(isReemplazo ? "Versión actualizada con éxito" : "Informe subido correctamente");
            handleModalForm();
        } catch (error) {
            error
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg space-y-5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    {isReemplazo ? `Reemplazando: ${object.titulo}` : "Nuevo Informe Económico"}
                </h3>
                <button type="button" onClick={handleModalForm} className="text-gray-400 hover:text-gray-600 font-bold text-xs uppercase">Cancelar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Título del Informe</label>
                    <input
                        {...register("titulo", { required: "El título es obligatorio" })}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                        placeholder="Ej: Informe de Gastos Marzo 2026"
                    />
                    {errors.titulo && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.titulo.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Periodo Académico</label>
                    <select
                        {...register("periodo", { required: "Seleccione un periodo" })}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-600"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="1">Periodo Lectivo 2026</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest italic">Archivo (PDF o EXCEL)</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-indigo-50/50 transition-colors group">
                    <input
                        type="file"
                        accept=".pdf,.xlsx,.xls"
                        {...register("archivo", {
                            required: isReemplazo ? "Debe subir la nueva versión" : "El archivo es requerido"
                        })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                        {archivoSeleccionado && archivoSeleccionado[0] ? (
                            <>
                                <span className="text-3xl block mb-2">📄</span>
                                <p className="text-sm font-bold text-indigo-600 tracking-tight truncate px-4">
                                    {archivoSeleccionado[0].name}
                                </p>
                                <p className="text-[10px] text-indigo-400 font-black uppercase mt-1">Listo para subir</p>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📁</span>
                                <p className="text-xs font-bold text-gray-500">Seleccionar Informe Económico</p>
                            </>
                        )}
                    </div>
                </div>
                {errors.archivo && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.archivo.message}</p>}
            </div>

            <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
            >
                {isReemplazo ? "Confirmar Reemplazo y Actualizar Versión" : "Registrar Informe en Sistema"}
            </button>
        </form>
    );
}