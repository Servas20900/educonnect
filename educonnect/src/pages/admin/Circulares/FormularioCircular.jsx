import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FileUpload } from '../../../components/ui';
import useSystemConfig from '../../../hooks/useSystemConfig';

const parseDestinatarios = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      return ['docentes'];
    }
  }

  return ['docentes'];
};

const getTodayDateISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultValues = (circular) => ({
  titulo: circular?.titulo || '',
  detalle: circular?.detalle || circular?.contenido || '',
  archivo_adjunto: null,
  fecha_vigencia_inicio: getTodayDateISO(),
  tipo_comunicado: circular?.tipo_comunicado || 'informativo',
  destinatarios: parseDestinatarios(circular?.destinatarios),
});

const FormularioCircular = forwardRef(function FormularioCircular(
  {
    circular,
    onSubmitCircular,
    uploading,
  },
  ref
) {
  const { getCatalog } = useSystemConfig();
  const DESTINATARIOS_OPTIONS = getCatalog('circulares_destinatarios', [
    { id: 'docentes', label: 'Docentes' },
    { id: 'estudiantes', label: 'Estudiantes' },
  ]);
  const TIPO_COMUNICADO_OPTIONS = getCatalog('circulares_tipos', [
    { value: 'informativo', label: 'Informativo' },
    { value: 'urgente', label: 'Urgente' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    reset,
    setValue,
  } = useForm({
    defaultValues: getDefaultValues(circular),
  });

  const todayDate = getTodayDateISO();

  useEffect(() => {
    reset({
      ...getDefaultValues(circular),
      fecha_vigencia_inicio: todayDate,
    });
  }, [circular, reset, todayDate]);

  useEffect(() => {
    setValue('fecha_vigencia_inicio', todayDate);
  }, [setValue, todayDate]);

  const estadoCalculado = 'Publicado';
  const archivoNuevo = watch('archivo_adjunto');
  const archivoActual = circular?.archivo_adjunto
    ? String(circular.archivo_adjunto).split('/').pop()
    : '';

  const submitForm = handleSubmit(async (data) => {
    const payload = {
      titulo: data.titulo.trim(),
      contenido: data.detalle.trim(),
      detalle: data.detalle.trim(),
      fecha_vigencia_inicio: todayDate,
      fecha_vigencia_fin: null,
      estado: estadoCalculado,
      categoria: 'General',
      tipo_comunicado: data.tipo_comunicado,
      destinatarios: data.destinatarios,
      visible: true,
    };

    await onSubmitCircular(payload, data.archivo_adjunto || null);
  });

  useImperativeHandle(ref, () => ({
    submit: submitForm,
  }));

  return (
    <div className="space-y-5">
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
          {...register('titulo', {
            required: 'El título es obligatorio',
            minLength: { value: 5, message: 'Debe tener al menos 5 caracteres' },
          })}
        />
        {errors.titulo && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.titulo.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Detalle
        </label>
        <textarea
          rows="4"
          className={`w-full rounded-md border ${
            errors.detalle ? 'border-red-500' : 'border-slate-300'
          } px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]`}
          {...register('detalle', {
            required: 'El detalle es obligatorio',
            minLength: { value: 10, message: 'Debe tener al menos 10 caracteres' },
          })}
          placeholder="Escribe aquí el detalle oficial de la circular"
        />
        {errors.detalle && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.detalle.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Tipo de Comunicado
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
          {...register('tipo_comunicado', {
            required: 'Debes seleccionar un tipo',
          })}
        >
          {TIPO_COMUNICADO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.tipo_comunicado && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.tipo_comunicado.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Fecha de Publicación
        </label>
        <input
          type="date"
          value={todayDate}
          disabled
          className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Adjuntar Archivo (Opcional)
        </label>
        <Controller
          name="archivo_adjunto"
          control={control}
          render={({ field }) => (
            <>
              <FileUpload
                onFile={(file) => field.onChange(file)}
                accept=".pdf,.docx,.jpg,.jpeg,.png,.html,.htm"
                label="Subir archivo de respaldo"
                hint="PDF, DOCX, JPG, PNG, HTML"
                currentFile={field.value?.name || archivoActual}
                disabled={uploading}
              />
              {archivoNuevo && (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                  onClick={() => setValue('archivo_adjunto', null)}
                >
                  Quitar archivo nuevo
                </button>
              )}
            </>
          )}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Destinatarios
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Controller
            name="destinatarios"
            control={control}
            rules={{
              validate: (value) =>
                Array.isArray(value) && value.length > 0
                  ? true
                  : 'Debes elegir al menos un destinatario',
            }}
            render={({ field }) => (
              <>
                {DESTINATARIOS_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                      field.value?.includes(option.id)
                        ? 'border-[#185fa5] bg-[#e6f1fb]'
                        : 'border-slate-300 bg-white hover:border-[#378add]'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-700">{option.label}</span>
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
                      className="h-4 w-4 rounded border-slate-300 text-[#185fa5] focus:ring-[#185fa5]"
                    />
                  </label>
                ))}
              </>
            )}
          />
          {errors.destinatarios && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.destinatarios.message}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        Estado al guardar: <span className="font-semibold">{estadoCalculado}</span>
      </div>
    </div>
  );
});

export default FormularioCircular;