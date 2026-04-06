import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Controller, useForm } from 'react-hook-form';
import CustomSelect from '../../../components/ui/CustomSelect';
import { FileUpload } from '../../../components/ui';

const getDefaultValues = (horario) => ({
  nombre: horario?.nombre || '',
  notas: horario?.notas || '',
  docente: horario?.docente || '',
  archivo: null,
  version: horario?.version || 1,
});

const FormularioHorario = forwardRef(function FormularioHorario(
  {
    horario,
    onSubmitHorario,
    uploading,
    usuarios,
    loadingUsuarios,
  },
  ref
) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: getDefaultValues(horario),
  });

  const archivoNuevo = watch('archivo');

  useEffect(() => {
    reset(getDefaultValues(horario));
  }, [horario, reset]);

  const submitForm = handleSubmit(async (data) => {
    const payload = {
      nombre: data.nombre.trim(),
      notas: data.notas.trim(),
      docente: data.docente ? parseInt(data.docente) : null,
      tipo_horario: 'Presencial',
      estado: 'Borrador',
      version: parseInt(data.version) || 1,
      grupo: null,
      fecha_vigencia_inicio: null,
      fecha_vigencia_fin: null,
      detalles: [],
    };

    await onSubmitHorario(payload, data.archivo || null);
  });

  useImperativeHandle(ref, () => ({
    submit: submitForm,
  }));

  const docentesOptions = (usuarios || [])
    .filter((usuario) => {
      const rolNombre = String(usuario?.rol?.nombre || '').toLowerCase();
      return rolNombre === 'docente';
    })
    .map((usuario) => {
      const persona = usuario?.persona;
      const nombreCompleto = persona
        ? [persona.nombre, persona.primer_apellido, persona.segundo_apellido]
            .filter(Boolean)
            .join(' ')
        : usuario?.username || `Usuario ${usuario.id}`;

      return {
        value: usuario.id,
        label: nombreCompleto,
      };
    });

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Nombre del Horario <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={`w-full rounded-md border ${
            errors.nombre ? "border-red-500" : "border-slate-300"
          } px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]`}
          placeholder="Ej: Horario Nivel 10°"
          {...register('nombre', {
            required: 'El nombre es obligatorio',
            minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
          })}
        />
        {errors.nombre && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.nombre.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Docente Asignado <span className="text-red-500">*</span>
        </label>
        <CustomSelect
          name="docente"
          control={control}
          options={docentesOptions}
          placeholder={loadingUsuarios ? 'Cargando docentes...' : 'Escribe para buscar docente...'}
          rules={{ required: 'Debes asignar un docente' }}
          isDisabled={loadingUsuarios}
          isClearable
        />
        {errors.docente && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.docente.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Documento del Horario <span className="text-red-500">*</span>
        </label>
        <Controller
          name="archivo"
          control={control}
          rules={{
            required: !horario ? 'Debes subir un documento de horario' : false,
          }}
          render={({ field }) => (
            <>
              <FileUpload
                onFile={(file) => field.onChange(file)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                label="Subir archivo"
                hint="PDF, Word, Excel o CSV"
                currentFile={field.value?.name || ''}
                disabled={uploading}
              />
              {archivoNuevo && (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                  onClick={() => setValue('archivo', null)}
                >
                  Quitar archivo
                </button>
              )}
            </>
          )}
        />
        {errors.archivo && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {errors.archivo.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Notas (Opcional)
        </label>
        <textarea
          rows="3"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
          {...register('notas')}
          placeholder="Notas o descripción del horario"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <p>
          <span className="font-semibold">Nota:</span> El horario será visible solo para el docente asignado
        </p>
      </div>
    </div>
  );
});

export default FormularioHorario;