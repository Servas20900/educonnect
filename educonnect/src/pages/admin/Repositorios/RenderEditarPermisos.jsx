import { useForm } from 'react-hook-form';

export default function RenderEditarPermisos({ repositorio, editarRepositorio, onSuccess, roles }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: {
            rol_acceso: repositorio.rol_acceso
        }
    });

    const onSubmit = async (data) => {
        const result = await editarRepositorio(repositorio.id, data);
        if (result.success) {
            onSuccess();
        }
    };

    return (
        <div className="p-8 bg-white rounded-3xl max-w-sm w-full">
            <h3 className="text-xl font-black text-gray-900 uppercase mb-2">Configuración</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                Carpeta: {repositorio.nombre}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                        Rol con acceso de lectura
                    </label>
                    
                    <div className="relative">
                        <select 
                            {...register("rol_acceso", { required: true })}
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-black uppercase appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">Seleccione un rol</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.nombre}>
                                    {rol.nombre.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ▼
                        </span>
                    </div>
                </div>

                <div className="flex gap-3 pt-6">
                    <button 
                        type="button"
                        onClick={onSuccess} 
                        className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 font-black text-[10px] uppercase rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 px-4 py-4 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 ${
                            isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
                        }`}
                    >
                        {isSubmitting ? "Guardando..." : "Actualizar"}
                    </button>
                </div>
            </form>
        </div>
    );
}