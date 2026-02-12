import { useEffect, useState } from 'react';
import { useCirculares } from "./Circulares/hooks/useCirculares";
import FormularioCircular from './Circulares/FormularioCircular';
import Toast from '../../../components/Toast';
import PopUp from '../../../components/PopUp';


export default function CircularesList() {
  const { cargarCirculares, circularesExistentes, loading, error, uploading, errorUploading, crearCircular, actualizarCircular, eliminarCircular } = useCirculares();
  const [form, setForm] = useState(false);
  const [object, setObject] = useState({});
  const [modal, setModal] = useState(false);
  const [information, setInformation] = useState("");
  const [idToDelete, setIdToDelete] = useState(null);
  const [archivar, setArchivar] = useState("")

  const [filtros, setFiltros] = useState({
    nombre: "",
    estado: ""
  });

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

  const openDeleteModal = (circular) => {
    const estado = circular.estado != "Inactivo" ? "archivar" : "desarchivar"
    setArchivar(estado)
    setIdToDelete(circular.id);
    setModal(true);
  };

  const confirmDelete = async () => {
    try {
      await eliminarCircular(idToDelete);
      setInformation("Se logro con éxito");
    } catch (err) {
      setInformation("Hubo un fallo");
    } finally {
      setModal(false);
      setIdToDelete(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  const circularesFiltradas = circularesExistentes.filter((circular) => {
    const coincideNombre = circular.titulo
      .toLowerCase()
      .includes(filtros.nombre.toLowerCase());

    const coincideEstado = filtros.estado
      ? circular.estado === filtros.estado
      : true;

    return coincideNombre && coincideEstado;
  });

  const getStatusStyles = (estado) => {
    const styles = {
      'Publicado': 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
      'Borrador': 'bg-amber-100 text-amber-700 ring-amber-600/20',
      'Inactivo': 'bg-slate-100 text-slate-600 ring-slate-600/10',
    };
    return styles[estado] || 'bg-gray-100 text-gray-600 ring-gray-600/10';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600 font-medium">Cargando circulares...</p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      {/* Modal de Confirmación Estilizada */}
      <PopUp closeModal={() => setModal(false)} isModalOpen={modal}>
        <div className="p-8 text-center bg-white rounded-2xl shadow-xl max-w-sm mx-auto">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${archivar === 'Activar' ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className="text-2xl">{archivar === 'Activar' ? '✅' : '⚠️'}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-tight">
            ¿Confirmar acción?
          </h3>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Estás a punto de <span className="font-bold text-gray-800">{archivar}</span> esta circular. Esta acción afectará su visibilidad en el portal.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setModal(false)}
              className="px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className={`px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 
                ${archivar === 'Activar' ? 'bg-green-600 shadow-green-200 hover:bg-green-700' : 'bg-red-600 shadow-red-200 hover:bg-red-700'}`}
            >
              Sí, {archivar}
            </button>
          </div>
        </div>
      </PopUp>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Circulares
          </h2>
        </div>
        <button
          className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:scale-95"
          onClick={handleModalForm}
        >
          <span className="text-xl mr-2">+</span> Nueva Circular
        </button>
      </div>

      {form && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
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

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por título..."
            name="nombre"
            value={filtros.nombre}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
          />
        </div>
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleChange}
          className="py-2.5 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-600"
        >
          <option value="">Todos los estados</option>
          <option value="Publicado">Publicado</option>
          <option value="Borrador">Borrador</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {circularesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center py-24">
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <span className="text-5xl">📂</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">No hay resultados</h2>
            <p className="text-gray-400 mt-2 font-medium text-center max-w-xs">Prueba ajustando los filtros o crea una nueva circular.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Contenido</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Programación</th>
                  <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {circularesFiltradas.map((circular) => (
                  <tr key={circular.id} className="hover:bg-indigo-50/40 transition-colors duration-200">
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-gray-800 hover:text-indigo-600 transition-colors cursor-default">
                        {circular.titulo}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full ring-1 ring-inset ${getStatusStyles(circular.estado)}`}>
                        {circular.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <span className="text-lg">📅</span>
                        {circular.fecha_vigencia_inicio || 'Inmediata'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-xs">
                      <div className="flex justify-end gap-3">
                        {circular.estado === "Inactivo" ? (
                          <button
                            className="px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            onClick={() => openDeleteModal(circular)}
                          >
                            ACTIVAR
                          </button>
                        ) : (
                          <>
                            <button
                              disabled={form}
                              className={`px-4 py-2 rounded-xl transition-all shadow-sm ${form
                                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                }`}
                              onClick={() => !form && handleEdit(circular)}
                            >
                              EDITAR
                            </button>
                            <button
                              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              onClick={() => openDeleteModal(circular)}
                            >
                              DESACTIVAR
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {information && <Toast information={information} setInformation={setInformation} />}
    </div>
  );
}