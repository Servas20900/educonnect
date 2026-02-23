import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

export default function FormularioPlantilla({
  uploading,
  errorUploading,
  crearPlantilla,
  actualizarPlantilla,
  handleClose,
  object,
  setInformation,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      nombre: object?.nombre || "",
      categoria: object?.categoria || "General",
    },
  });

  const [estado, setEstado] = useState(object?.estado || "Borrador");

  useEffect(() => {
    reset({
      nombre: object?.nombre || "",
      categoria: object?.categoria || "General",
    });
    setEstado(object?.estado || "Borrador");
  }, [object, reset]);

  const onSubmit = async (data) => {
    const payload = {
      nombre: data.nombre,
      categoria: data.categoria,
      estado,
    };

    let res;
    if (!object?.id) {
      res = await crearPlantilla(payload);
      if (res.success) {
        setInformation("Plantilla creada con éxito");
        handleClose();
      } else {
        setInformation("Error al crear plantilla");
      }
    } else {
      res = await actualizarPlantilla(payload, object.id);
      if (res.success) {
        setInformation("Plantilla actualizada con éxito");
        handleClose();
      } else {
        setInformation("Error al actualizar plantilla");
      }
    }
  };

  return (
    <div className="bg-white p-2">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">
          {!object?.id ? "Nueva Plantilla" : "Editar Plantilla"}
        </h3>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre
          </label>
          <input
            className={`block w-full rounded-lg border ${errors.nombre ? "border-red-500" : "border-gray-300"} px-4 py-2.5`}
            placeholder="Ej: Oficio estándar"
            {...register("nombre", { required: "El nombre es obligatorio" })}
          />
          {errors.nombre && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.nombre.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Categoría
          </label>
          <select
            className={`block w-full rounded-lg border ${errors.categoria ? "border-red-500" : "border-gray-300"} px-4 py-2.5 bg-white`}
            {...register("categoria", {
              required: "Debes elegir una categoría",
            })}
          >
            <option value="General">General</option>
            <option value="Comunicados">Comunicados</option>
            <option value="Comité">Comité</option>
          </select>
          {errors.categoria && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.categoria.message}
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Documento adjunto (PDF/DOCX)
            </label>

            <input
              type="file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              {...register("archivo_adjunto")}
            />

            {object?.archivo_adjunto && (
              <p className="text-xs text-indigo-600 mt-1">
                Archivo actual:{" "}
                <a
                  href={object.archivo_adjunto}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Ver documento
                </a>
              </p>
            )}
          </div>
        </div>

        {errorUploading && (
          <div className="text-xs text-red-600 font-medium">
            Hubo un error, por favor intente más tarde.
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={uploading}
            onClick={() => setEstado("Borrador")}
            className="px-6 py-2.5 border border-gray-300 text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Guardar Borrador
          </button>

          <button
            type="submit"
            disabled={uploading}
            onClick={() => setEstado("Publicado")}
            className="px-6 py-2.5 text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {uploading ? "Procesando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
