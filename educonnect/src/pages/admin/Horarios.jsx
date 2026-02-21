import React from 'react';
import FormularioHorario from './Horarios/FormularioHorario';
import RevisionHorarios from './Horarios/RevisionHorarios';
import { useHorarios } from './Horarios/hooks/useHorarios';
import { useEffect, useState } from 'react';
import Toast from '../../../components/Toast';


export default function Horarios() {
  const { cargarHorario, HorarioExistentes, loading, error, uploading, errorUploading, crearHorario, actualizarHorario, eliminarHorario,cargarUsuario,loadingUsers,errorUsers,usuarios,cargarGrupos,loadingGrupos,errorGrupos,grupos,cargarAsignaturas,loadingAsignaturas,errorAsignaturas,asignaturas
    } = useHorarios();
  const [form, setForm] = useState(false);
  const [object, setObject] = useState({});
  const [information, setInformation] = useState("");

  useEffect(() => {
    cargarHorario();
    cargarUsuario();
    cargarGrupos();
    cargarAsignaturas();
  }, [cargarHorario,cargarUsuario,cargarAsignaturas,cargarGrupos]);

  const handleModalForm = () => {
    setForm(!form);
    setObject({})
  };

  const onEdit = (horario) => {
    setObject(horario);
    setForm(true);
  };

  if (loading) return <div className="p-10 text-center">Cargando circulares...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error al cargar datos.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100'>
        <h2 className="text-3xl font-bold text-gray-800 ">
          Gestión de Horarios Académicos
        </h2>
        <button
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={handleModalForm}
        >
          <span className="mr-2">+</span> Crear Horario
        </button>
      </div>

      {form && (
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <FormularioHorario
            uploading={uploading}
            errorUploading={errorUploading}
            crearHorario={crearHorario}
            handleModalForm={handleModalForm}
            object={object}
            actualizarHorario={actualizarHorario}
            setInformation={setInformation}
            usuarios ={usuarios}
            grupos ={grupos}
            asignaturas ={asignaturas}
          />
        </section>
      )}

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Horarios Pendientes de Aprobación
        </h2>

        {HorarioExistentes.length > 0 ? (
          <RevisionHorarios
            horarios={HorarioExistentes}
            deleteHorario={eliminarHorario}
            onEdit={onEdit}
            actualizarHorario = {actualizarHorario}
          />
        ) : (
          <div className="flex flex-col items-center py-16">
            <div className="text-gray-300 mb-4 text-6xl">📄</div>
            <h2 className="text-xl font-medium text-gray-500">No hay horarios a revisar</h2>
            <p className="text-gray-400">Los horarios que crees aparecerán aquí.</p>
          </div>
        )}
      </section>
      {information !== "" && (
        <Toast
          information={information}
          setInformation={setInformation}
        />
      )}

    </div>
  );
};

