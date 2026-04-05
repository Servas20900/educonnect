import { useEffect, useState } from 'react';
import { useHorarios } from './Horarios/hooks/useHorarios';
import FormularioHorario from './Horarios/FormularioHorario';
import RevisionHorarios from './Horarios/RevisionHorarios';
import { PageHeader, DataTable } from '../../components/ui';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import Toast from '../../../components/Toast';

export default function Horarios() {
  const {
    cargarHorario,
    HorarioExistentes,
    loading,
    error,
    uploading,
    crearHorario,
    actualizarHorario,
    eliminarHorario,
    cargarUsuario,
    usuarios,
    cargarGrupos,
    grupos,
    cargarAsignaturas,
    asignaturas
  } = useHorarios();

  const [formOpen, setFormOpen] = useState(false);
  const [currentObject, setCurrentObject] = useState(null);
  const [information, setInformation] = useState("");

  useEffect(() => {
    cargarHorario();
    cargarUsuario();
    cargarGrupos();
    cargarAsignaturas();
  }, [cargarHorario, cargarUsuario, cargarAsignaturas, cargarGrupos]);

  const handleOpenForm = () => {
    setCurrentObject(null);
    setFormOpen(true);
  };

  const handleEdit = (horario) => {
    setCurrentObject(horario);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setCurrentObject(null);
  };

  const handleSuccess = (msg) => {
    setInformation(msg);
    handleCloseForm();
    setTimeout(() => setInformation(""), 3000);
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Cargando módulos de horarios...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error al conectar con el servidor.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Horarios Institucionales"
        action={{
          label: 'Nuevo Horario',
          onClick: handleOpenForm,
          icon: '+',
        }}
      />

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {HorarioExistentes.length > 0 ? (
          <RevisionHorarios
            horarios={HorarioExistentes}
            deleteHorario={eliminarHorario}
            onEdit={handleEdit}
            actualizarHorario={actualizarHorario}
          />
        ) : (
          <div className="flex flex-col items-center py-24 bg-white">
            <h2 className="text-xl font-semibold text-slate-600">No hay horarios definidos</h2>
            <p className="text-slate-400 mt-2">Los horarios creados aparecerán en esta lista para su revisión.</p>
            <button
              onClick={handleOpenForm}
              className="mt-6 px-6 py-2 bg-[#185fa5] text-white rounded-md text-sm font-medium hover:bg-[#0b2545] transition-all"
            >
              Crear Horario ahora
            </button>
          </div>
        )}
      </section>

      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="md"
        PaperProps={{
          className: 'rounded-xl',
          style: { borderRadius: '16px' }
        }}
      >
        <DialogTitle className="text-xl font-bold text-[#0b2545] border-b border-slate-100 px-8 py-5">
          {currentObject ? 'Actualizar Horario' : 'Configuración de Nuevo Horario'}
        </DialogTitle>
        <DialogContent className="px-8 py-6">
          <FormularioHorario
            uploading={uploading}
            crearHorario={async (data) => {
              await crearHorario(data);
              handleSuccess("Horario creado exitosamente");
            }}
            actualizarHorario={async (data, id) => {
              await actualizarHorario(data, id);
              handleSuccess("Horario actualizado correctamente");
            }}
            handleModalForm={handleCloseForm}
            object={currentObject}
            usuarios={usuarios}
            grupos={grupos}
            asignaturas={asignaturas}
          />
        </DialogContent>
      </Dialog>

      {information !== "" && (
        <Toast
          information={information}
          setInformation={setInformation}
        />
      )}
    </div>
  );
}