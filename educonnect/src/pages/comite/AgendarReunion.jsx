import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useComites } from './reuniones/useComites';
import CustomSelect from '../../components/ui/CustomSelect';

export default function AgendarReunion({ onSuccess }) {
    const {
        handleNuevaReunion,
        loading,
        personas,
        actasPrevias,
        cargarCatalogosReunion
    } = useComites();

    useEffect(() => {
        cargarCatalogosReunion();
    }, [cargarCatalogosReunion]);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            lugar: "",
            hora_inicio: "08:00",
            tema: "",
            asistentes: [],
            actas_adjuntas: []
        }
    });

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            estado: 'Programada',
            asistentes: data.asistentes.map(id => ({ id: parseInt(id) })),
            metadatos: {
                actas_referenciadas: data.actas_adjuntas
            }
        };

        const result = await handleNuevaReunion(payload);
        if (result.success) {
            reset();
            onSuccess?.();
        }
    };

    const optionsAsistentes = personas
        .filter(p => p !== null && p !== undefined && p.rol?.nombre == "comite")
        .map(p => {
            const datosPersona = p.persona;

            const nombreMostrar = datosPersona
                ? `${datosPersona.nombre} ${datosPersona.primer_apellido || ''}`
                : `Usuario: ${p.username}`;

            return {
                value: p.id,
                label: `${nombreMostrar} - ${p.email || 'Sin correo'}`
            };
        });

    const optionsActas = actasPrevias.map(a => ({
        value: a?.id,
        label: `Acta N° ${a?.numero_acta ?? 'S/N'} - ${a?.fecha_elaboracion?.split('T')[0] ?? 'Sin fecha'}`
    }));

    return (
        <div className="p-8 bg-white rounded-3xl shadow-xl max-w-4xl mx-auto border border-gray-100">
            {/* Encabezado */}
            <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                    Agendar Reunión
                </h2>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Módulo de Comités e Instituciones
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Tema / Asunto */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Asunto Central</label>
                    <input
                        {...register("tema", { required: "El asunto es obligatorio" })}
                        type="text"
                        placeholder="Ej: Seguimiento de Plan de Trabajo Anual"
                        className={`w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-purple-500 transition-all ${errors.tema ? 'ring-2 ring-red-400' : ''}`}
                    />
                </div>

                {/* Fecha, Hora y Lugar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha</label>
                        <input
                            {...register("fecha", { required: true })}
                            type="date"
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hora Inicio</label>
                        <input
                            {...register("hora_inicio", { required: true })}
                            type="time"
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lugar</label>
                        <input
                            {...register("lugar", { required: true })}
                            type="text"
                            placeholder="Sala de Juntas / Teams"
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Selección de Asistentes */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Convocar Participantes</label>
                    <CustomSelect
                        name="asistentes"
                        control={control}
                        options={optionsAsistentes}
                        placeholder="Buscar por nombre o correo..."
                        isMulti={true}
                        isLoading={loading}
                        rules={{ required: "Debe seleccionar al menos un asistente" }}
                    />
                    {errors.asistentes && <span className="text-[10px] text-red-500 font-bold ml-1">{errors.asistentes.message}</span>}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Referenciar Actas Previas</label>
                    <CustomSelect
                        name="actas_adjuntas"
                        control={control}
                        options={optionsActas}
                        placeholder="Seleccione actas para seguimiento..."
                        isMulti={true}
                        isLoading={loading}
                    />
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 ml-1">
                        Esto permitirá a los asistentes revisar antecedentes antes de la reunión.
                    </p>
                </div>

                {/* Botón de Acción */}
                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all transform hover:-translate-y-1 shadow-lg ${loading
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-purple-600 text-white shadow-purple-100 hover:bg-purple-700"
                            }`}
                    >
                        {loading ? "Registrando..." : "Registrar Reunión y Enviar Notificaciones"}
                    </button>
                </div>
            </form>
        </div>
    );
}