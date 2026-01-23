import { useEffect, useState } from 'react';
import { useCirculares } from "./Circulares/hooks/useCirculares";
import FormularioCircular from './Circulares/FormularioCircular';
import Toast from '../../../components/Toast';
import PopUp from '../../../components/PopUp';


export default function CircularesList() {
  const { cargarCirculares, circularesExistentes, loading, error, uploading, errorUploading, crearCircular, actualizarCircular, eliminarCircular } = useCirculares();
  const [form, setForm] = useState(false);
  const [object, setObject] = useState({})
  const [modal, setModal] = useState(false)
  const [information, setInformation] = useState("")
  const [idToDelete, setIdToDelete] = useState(null);

  useEffect(() => {
    cargarCirculares();
  }, [cargarCirculares]);

  const handleModalForm = () => {
    setForm(!form);
    setObject({})
  };

  const handleEdit = (circular) => {
    setObject(circular);
    setForm(!form);
  }

  const openDeleteModal = (id) => {
    setIdToDelete(id);
    setModal(true);
  };

  const confirmDelete = async () => {
    try {
      await eliminarCircular(idToDelete);
      setInformation("Se eliminó con éxito");
    } catch (err) {
      setInformation("Fallo al eliminar");
    } finally {
      setModal(false);
      setIdToDelete(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando circulares...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error al cargar datos.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PopUp closeModal={() => setModal(false)} isModalOpen={modal}>
        <div className="p-6 text-center bg-white rounded-lg">

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Confirmar eliminación
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            ¿Estás seguro de que deseas eliminar esta circular? Esta acción marcará el registro como inactivo y no aparecerá en la lista principal.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setModal(false)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </PopUp>
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-3xl font-extrabold text-gray-800">
          Gestión de Circulares
        </h2>
        <button
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={handleModalForm}
        >
          <span className="mr-2">+</span> Crear Circular
        </button>
      </div>

      {form && (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100 transition-all">

          <FormularioCircular
            uploading={uploading}
            errorUploading={errorUploading}
            crearCircular={crearCircular}
            handleModalForm={handleModalForm}
            object={object}
            actualizarCircular={actualizarCircular}
            setInformation={setInformation}
          />
        </div>
      )}
      {information !== "" && (
        <Toast
          information={information}
          setInformation={setInformation}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {circularesExistentes.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="text-gray-300 mb-4 text-6xl">📄</div>
            <h2 className="text-xl font-medium text-gray-500">No hay circulares registradas</h2>
            <p className="text-gray-400">Las circulares que crees aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Programación</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {circularesExistentes.map((circular) => (
                  circular.estado != "Inactivo" && (
                    <tr key={circular.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{circular.titulo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                        ${circular.estado === 'Publicado' ? 'bg-green-100 text-green-700' :
                            circular.estado === 'Borrador' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'}`}>
                          {circular.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {circular.fecha_vigencia_inicio || 'Inmediata'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          className={`px-2 py-1 rounded transition-colors ${form
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                            }`}
                          onClick={() => {
                            if (form) {
                              setInformation("Debes cerrar el formulario de edición antes de elegir otra circular");
                              return;
                            }
                            handleEdit(circular);
                          }}
                        >
                          Editar
                        </button>
                        <button className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                          onClick={() => openDeleteModal(circular.id)}
                        >Borrar</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

}