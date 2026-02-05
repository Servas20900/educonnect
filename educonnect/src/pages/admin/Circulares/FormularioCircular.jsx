import { useState } from "react";
import { useForm } from "react-hook-form";

const FormularioCircular = ({ uploading, errorUploading, crearCircular, handleModalForm, object, actualizarCircular, setInformation }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            titulo: object.titulo || "",
            contenido: object.contenido || "",
            archivo_adjunto: null,
            fecha_vigencia_inicio: object.fecha_vigencia_inicio || "",
            fecha_vigencia_fin: object.fecha_vigencia_fin || null,
            estado: object.estado || "",
            categoria: object.categoria || ""
        }
    });
    const [estado, setEstado] = useState("");

    const MAX_FILE_SIZE = 5242880;

    const onSubmitHandler = async (data) => {
        const archivoParaSubir = (data.archivo_adjunto instanceof FileList && data.archivo_adjunto.length > 0)
            ? data.archivo_adjunto[0]
            : null;
        
        const dataFinal = {
            titulo: data.titulo,
            contenido: data.contenido,
            fecha_vigencia_inicio: data.fecha_vigencia_inicio,
            fecha_vigencia_fin: data.fecha_vigencia_fin || null,
            estado: estado,
            categoria: data.categoria
        };

        var response;
        var objetivo;

        if (!object.id) {
            response = await crearCircular(dataFinal, archivoParaSubir);
            objetivo = "Creado";
        } else {
            response = await actualizarCircular(dataFinal, object.id, archivoParaSubir);
            objetivo = "Actualizado";
        }
        console.log(response)
        if (response.success) {
            setInformation(objetivo + " con éxito");
            handleModalForm();
        } else {
            setInformation("Hubo un error, por favor intente más tarde");
        }
    };

    return (
        <>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-700">{Object.keys(object).length === 0 ? "Nueva Circular" : "Editar Circular"}</h3>
                <button onClick={handleModalForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="bg-white p-2">
                <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Título de la Circular</label>
                        <input
                            type="text"
                            className={`block w-full rounded-lg border ${errors.titulo ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                            placeholder="Ej: Ajuste de horario institucional"
                            {...register("titulo", { required: "El título es obligatorio" })}
                        />
                        {errors.titulo && <p className="mt-1 text-xs text-red-500 font-medium">{errors.titulo.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contenido Detallado</label>
                        <textarea
                            rows="4"
                            className={`block w-full rounded-lg border ${errors.contenido ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                            {...register("contenido", { required: "El contenido no puede estar vacío" })}
                            placeholder="Escribe el cuerpo de la circular aquí..."
                        ></textarea>
                        {errors.contenido && <p className="mt-1 text-xs text-red-500 font-medium">{errors.contenido.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Publicación</label>
                            <input
                                type="date"
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                {...register("fecha_vigencia_inicio", { required: "Campo requerido" })}
                            />
                            {errors.fecha_vigencia_inicio && <p className="mt-1 text-xs text-red-500 font-medium">{errors.fecha_vigencia_inicio.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Caducidad</label>
                            <input
                                type="date"
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                {...register("fecha_vigencia_fin")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Documento Adjunto (PDF)</label>
                            <input
                                type="file"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                accept="application/pdf"
                                {...register("archivo_adjunto", {
                                    validate: {
                                        lessThan5MB: (files) => {
                                            if (!files || files.length === 0) return true;
                                            return files[0].size <= MAX_FILE_SIZE || "El archivo es demasiado grande (Máx 5MB)";
                                        },
                                        acceptedFormats: (files) => {
                                            if (!files[0]) return true;
                                            const validExtensions = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                                            return validExtensions.includes(files[0].type) || "Formato no permitido";
                                        }
                                    }
                                })}
                            />
                        </div>
                        {errors.archivo_adjunto && (
                            <p className="mt-1 text-xs text-red-500 font-medium">
                                {errors.archivo_adjunto.message}
                            </p>
                        )}
                        {object.archivo_adjunto && (
                            <p className="text-xs text-indigo-600 mt-1">
                                Archivo actual: <a href={object.archivo_adjunto} target="_blank" rel="noreferrer" className="underline">Ver PDF</a>
                            </p>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                            <select
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
                                {...register("categoria", { required: "Debes elegir una categoría" })}
                            >
                                <option value="">Selecciona una categoría...</option>
                                <option value="Institucional">Institucional</option>
                                <option value="General">General</option>
                            </select>
                            {errors.categoria && <p className="mt-1 text-xs text-red-500 font-medium">{errors.categoria.message}</p>}
                        </div>
                    </div>

                    {errorUploading && <span className="mt-1 text-xs text-red-500 font-medium text-red-600">Hubo un error porfavor intentelo mas tarde</span>}

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={uploading}
                            onClick={() => setEstado("Borrador")}
                            className="px-6 py-2.5 border border-gray-300 text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
                        >
                            Guardar Borrador
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            onClick={() => setEstado("Publicado")}
                            className="px-6 py-2.5 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                        >
                            {uploading ? 'Procesando...' : 'Publicar Circular'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default FormularioCircular;