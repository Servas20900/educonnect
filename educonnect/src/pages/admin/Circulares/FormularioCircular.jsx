import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";

const FormularioCircular = ({
  circular,
  onSuccess,
  onCancel,
  uploading,
}) => {
  const { register, handleSubmit, formState: { errors }, watch, control } = useForm({
    defaultValues: {
      titulo: circular?.titulo || "",
      detalle: circular?.detalle || "",
      archivo_adjunto: null,
      fecha_vigencia_inicio: circular?.fecha_vigencia_inicio || "",
      categoria: circular?.categoria || "",
      tipo_comunicado: circular?.tipo_comunicado || "",
      destinatarios: (circular?.destinatarios && Array.isArray(circular.destinatarios)) ? circular.destinatarios : ["docentes"],
      visible: circular?.visible !== undefined ? circular.visible : true,
    }
  });

  const fechaInicio = watch("fecha_vigencia_inicio");

  const destinatariosOptions = [
    { id: "docentes", label: "Docentes" },
  ];

  const isFutureDate = (dateString) => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  const onSubmitHandler = async (data) => {
    if (!data.titulo) {
      console.error('El título es requerido');
      return;
    }

    let finalEstado = "Publicado";

    if (isFutureDate(data.fecha_vigencia_inicio)) {
      finalEstado = "Borrador";
    }

    const archivoParaSubir =
      data.archivo_adjunto instanceof FileList && data.archivo_adjunto.length > 0
        ? data.archivo_adjunto[0]
        : null;

    const dataFinal = {
      titulo: data.titulo,
      contenido: data.titulo,
      detalle: data.detalle || null,
      fecha_vigencia_inicio: data.fecha_vigencia_inicio,
      fecha_vigencia_fin: null,
      estado: finalEstado,
      categoria: data.categoria,
      tipo_comunicado: data.tipo_comunicado,
      destinatarios: data.destinatarios,
      visible: data.visible,
    };

    try {
      await onSuccess(dataFinal, archivoParaSubir);
    } catch (error) {
      console.error('Error en onSuccess:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Título de la Circular
        </label>
        <input
          type="text"
          className={`w-full rounded-md border ${
            errors.titulo ? "border-red-500" : "border-slate-300"
          } px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]`}
          placeholder="Ej: Ajuste de horario institucional"
          {...register("titulo", { required: "El título es obligatorio" })}
        />
        {errors.titulo && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.titulo.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Adjuntar Archivo
        </label>
        <input
          type="file"
          className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#e6f1fb] file:text-[#185fa5] hover:file:bg-[#d0e6f7]"
          {...register("archivo_adjunto")}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Detalle Adicional (Opcional)
        </label>
        <textarea
          rows="2"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
          {...register("detalle")}
          placeholder="Información adicional complementaria..."
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tipo de Comunicado
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
            placeholder="Ej: Informativo, Urgente, Evento..."
            {...register("tipo_comunicado")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Categoría
          </label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
            {...register("categoria", {
              required: "Debes elegir una categoría",
            })}
          >
            <option value="">Selecciona una categoría...</option>
            <option value="Institucional">Institucional</option>
            <option value="General">General</option>
          </select>
          {errors.categoria && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.categoria.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Fecha de Publicación
        </label>
        <input
          type="date"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
          {...register("fecha_vigencia_inicio", {
            required: "Campo requerido",
          })}
        />
        {isFutureDate(fechaInicio) && (
          <p className="mt-1 text-xs text-amber-600 font-medium">
            Se guardará como Borrador hasta la fecha seleccionada
          </p>
        )}
        {errors.fecha_vigencia_inicio && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.fecha_vigencia_inicio.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Destinatarios
        </label>
        <div className="space-y-2">
          <Controller
            name="destinatarios"
            control={control}
            render={({ field }) => (
              <>
                {destinatariosOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={field.value?.includes(option.id) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...(field.value || []), option.id]);
                        } else {
                          field.onChange(field.value.filter((v) => v !== option.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#185fa5] focus:ring-[#185fa5]"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </>
            )}
          />
        </div>
      </div>

      <div>
        <Controller
          name="visible"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={field.value || false}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#185fa5] focus:ring-[#185fa5]"
              />
              <span className="text-sm font-medium text-slate-700">
                Visible en el portal
              </span>
            </label>
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 rounded-md bg-[#185fa5] text-sm font-medium text-white transition-colors hover:bg-[#0b2545] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Procesando..." : "Publicar Circular"}
        </button>
      </div>
    </form>
  );
};

export default FormularioCircular;