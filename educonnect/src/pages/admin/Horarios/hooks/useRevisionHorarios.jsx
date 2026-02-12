import { useState } from 'react';

export const useRevisionHorarios = (horarios, actualizarHorario, deleteHorario) => {
    const [modal, setModal] = useState(false);
    const [accion, setAccion] = useState("");
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

    const handleOption = (tipoAccion, dataHorario) => {
        setAccion(tipoAccion);
        setHorarioSeleccionado(dataHorario);
        setModal(true);
    };

    const closeModal = () => {
        setModal(false);
        setHorarioSeleccionado(null);
    };

    const processPayload = (comentarioAdmin) => {
        if (!horarioSeleccionado) return null;

        const esRechazo = accion === "Rechazar" || accion === "Reactivar";
        const { docente_info, aprobaciones, detalles, ...datosBase } = horarioSeleccionado;

        const detallesLimpios = detalles?.map(d => ({
            ...d,
            docente: d.docente || d.docente_info?.id,
            asignatura: d.asignatura || d.asignatura_info?.id,
            docente_info: undefined,
            asignatura_info: undefined
        })) || [];

        return {
            ...datosBase,
            docente: docente_info?.id,
            estado: esRechazo ? "Borrador" : "Publicado",
            detalles: detallesLimpios,
            aprobaciones: [
                {
                    nivel_aprobacion: 1,
                    estado_aprobacion: esRechazo ? "Rechazado" : "Aprobado",
                    comentarios: comentarioAdmin || (!esRechazo && "Aprobado por administración"),
                    fecha_revision: new Date().toISOString()
                }
            ]
        };
    };

    const handleConfirm = (comentario) => {
        const payload = processPayload(comentario);
        if (payload) {
            actualizarHorario(payload, horarioSeleccionado.id);
            closeModal();
        }
    };

    const handleDelete = () => {
        if (horarioSeleccionado) {
            deleteHorario(horarioSeleccionado.id);
            closeModal();
        }
    };

    return {
        modal,
        accion,
        horarioSeleccionado,
        handleOption,
        closeModal,
        handleConfirm,
        handleDelete
    };
};