import { useEffect, useMemo, useState } from "react";
import { useOficiosPlantillas } from "./useOficiosPlantillas";
import FormularioPlantilla from "./FormularioPlantilla";
import { DataTable, PageHeader, BtnEditar, BtnActivar, BtnDesactivar } from '../../../components/ui';

export default function OficiosPlantillas() {
  const {
    cargarPlantillas,
    plantillasExistentes,
    loading,
    error,
    uploading,
    errorUploading,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
  } = useOficiosPlantillas();

  const [form, setForm] = useState(false);
  const [object, setObject] = useState({});
  const [mensaje, setMensaje] = useState("");

  const [filtros, setFiltros] = useState({
    nombre: "",
    categoria: "",
    estado: "",
  });

  useEffect(() => {
    cargarPlantillas();
  }, [cargarPlantillas]);

  const handleModalForm = () => {
    setForm((v) => !v);
    setObject({});
  };

  const handleEdit = (p) => {
    setObject(p);
    setForm(true);
  };

  const handleToggleEstado = async (p) => {
    try {
      await eliminarPlantilla(p.id);
      setMensaje("Estado actualizado");
    } catch {
      setMensaje("Error actualizando estado");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const plantillasFiltradas = useMemo(() => {
    return (plantillasExistentes || []).filter((p) => {
      const nombreOk =
        !filtros.nombre ||
        (p.nombre || "").toLowerCase().includes(filtros.nombre.toLowerCase());
      const categoriaOk = !filtros.categoria || p.categoria === filtros.categoria;
      const estadoOk = !filtros.estado || p.estado === filtros.estado;
      return nombreOk && categoriaOk && estadoOk;
    });
  }, [plantillasExistentes, filtros]);

  const badge = (estado) => {
    if (estado === "Publicado") return "bg-emerald-100 text-emerald-700";
    if (estado === "Inactivo") return "bg-slate-100 text-slate-600";
    return "bg-amber-100 text-amber-700";
  };

  const tableColumns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (p) => <span className="font-bold text-slate-800">{p.nombre}</span>,
    },
    {
      key: 'categoria',
      label: 'Categoría',
      render: (p) => <span className="text-slate-600 font-medium">{p.categoria}</span>,
    },
    {
      key: 'ultima_actualizacion',
      label: 'Actualización',
      render: (p) => <span className="text-slate-500">{p.ultima_actualizacion}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => (
        <span className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full ${badge(p.estado)}`}>
          {p.estado?.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (p) => (
        <div className="flex justify-end gap-2">
          {p.archivo_adjunto ? (
            <a
              href={p.archivo_adjunto}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#185fa5]"
            >
              Ver
            </a>
          ) : (
            <span className="text-xs text-slate-400">Sin archivo</span>
          )}
          <BtnEditar onClick={() => handleEdit(p)} />
          {p.estado === "Inactivo" ? (
            <BtnActivar onClick={() => handleToggleEstado(p)} />
          ) : (
            <BtnDesactivar onClick={() => handleToggleEstado(p)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oficios y Plantillas"
        subtitle="Catálogo de formatos oficiales."
        action={{
          label: 'Nueva plantilla',
          onClick: handleModalForm,
          icon: '+',
        }}
      />

      {mensaje ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {mensaje}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error?.detail || error?.message || "Error al cargar plantillas"}
        </div>
      ) : null}

      {form ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormularioPlantilla
            uploading={uploading}
            errorUploading={errorUploading}
            crearPlantilla={crearPlantilla}
            actualizarPlantilla={actualizarPlantilla}
            handleClose={handleModalForm}
            object={object}
            setInformation={setMensaje}
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          name="nombre"
          value={filtros.nombre}
          onChange={handleChange}
          className="flex-1 min-w-[250px] rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
        />
        <select
          name="categoria"
          value={filtros.categoria}
          onChange={handleChange}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          <option value="General">General</option>
          <option value="Comunicados">Comunicados</option>
          <option value="Comité">Comité</option>
        </select>
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleChange}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="Publicado">Publicado</option>
          <option value="Borrador">Borrador</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <DataTable
        columns={tableColumns}
        data={plantillasFiltradas}
        loading={loading}
        pageSize={8}
        emptyMessage="No hay plantillas. Ajustá los filtros o creá una nueva."
        emptyAction={{ label: 'Nueva plantilla', onClick: handleModalForm }}
      />
    </div>
  );
}
