import { Fragment, useEffect, useState } from 'react';
import {
  PageHeader,
  SearchFilter,
  EmptyState,
  StatusBadge,
} from '../../components/ui';
import { downloadCircularArchivo, fetchCirculares } from '../../api/circulares';
import useSystemConfig from '../../hooks/useSystemConfig';

export default function CircularesDocente() {
  const [circulares, setCirculares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const { getCatalog } = useSystemConfig();
  const categoriasCirculares = getCatalog('circulares_categorias', [
    { value: 'Institucional', label: 'Institucional' },
    { value: 'General', label: 'General' },
  ]);

  const handleDownload = async (circular) => {
    setDownloadError('');
    setDownloadSuccess('');
    setDownloadingId(circular.id);
    try {
      const response = await downloadCircularArchivo(circular.id);
      const rawBlob = response.data;
      const contentType = String(response.headers?.['content-type'] || '').toLowerCase();

      if (!rawBlob || rawBlob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }

      if (contentType.includes('application/json') || contentType.includes('text/html')) {
        throw new Error('El servidor devolvió una respuesta no válida para descarga');
      }

      const blob = rawBlob.type
        ? rawBlob
        : new Blob([rawBlob], { type: contentType || 'application/octet-stream' });

      const contentDisposition = response.headers?.['content-disposition'] || '';
      const encodedFileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainFileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const encodedFileName = encodedFileNameMatch?.[1]
        ? decodeURIComponent(encodedFileNameMatch[1])
        : null;
      const plainFileName = plainFileNameMatch?.[1] || null;

      const storageName = circular?.archivo_adjunto
        ? String(circular.archivo_adjunto).split('/').pop()
        : null;
      const fallbackName = `${(circular?.titulo || 'circular').replace(/\s+/g, '_')}.pdf`;
      const fileName = encodedFileName || plainFileName || storageName || fallbackName;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);
      setDownloadSuccess(`Se descargó correctamente: ${fileName}`);
      window.setTimeout(() => setDownloadSuccess(''), 5000);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      const errorMessage = error?.message || 'No fue posible descargar el archivo';
      setDownloadError(`No se descargó el archivo. ${errorMessage}`);
      window.setTimeout(() => setDownloadError(''), 6000);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const cargarCirculares = async () => {
      try {
        setLoading(true);
        const data = await fetchCirculares();
        const circularesFiltradas = Array.isArray(data)
          ? data.filter((c) => {
              if (String(c.estado || '').toLowerCase() !== 'publicado') return false;
              if (c.visible === false) return false;

              let destinatarios = c.destinatarios;
              if (typeof destinatarios === 'string') {
                try {
                  destinatarios = JSON.parse(destinatarios);
                } catch {
                  destinatarios = [];
                }
              }

              if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
                return true;
              }

              const listaNormalizada = destinatarios
                .map((d) => String(d || '').toLowerCase())
              return listaNormalizada.includes('docentes');
            })
          : [];
        setCirculares(circularesFiltradas);
      } catch (error) {
        console.error('Error al cargar circulares:', error);
        setCirculares([]);
      } finally {
        setLoading(false);
      }
    };

    cargarCirculares();
  }, []);

  const filteredCirculares = circulares.filter((circular) => {
    const matchesSearch = circular.titulo
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    const matchesFilter = filterCategoria
      ? String(circular.categoria || '').toLowerCase() === filterCategoria.toLowerCase()
      : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Circulares Recibidas" />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por título..."
        filters={[
          {
            key: 'categoria',
            label: 'Categoría:',
            options: categoriasCirculares,
          },
        ]}
        onFilterChange={({ value }) => setFilterCategoria(value)}
      />

      {downloadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          {downloadError}
        </div>
      )}

      {downloadSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          {downloadSuccess}
        </div>
      )}

      <div className="space-y-4">
        {!loading && filteredCirculares.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            message="No hay circulares disponibles en este momento"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Fecha de Publicación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading
                  ? Array.from({ length: 3 }).map((_, rowIndex) => (
                      <tr key={`skeleton-row-${rowIndex}`}>
                        {Array.from({ length: 4 }).map((__, columnIndex) => (
                          <td key={`skeleton-${rowIndex}-${columnIndex}`} className="px-4 py-3">
                            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredCirculares.map((circular) => (
                      <Fragment key={circular.id}>
                        <tr className="transition-colors hover:bg-[#e6f1fb]">
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <div className="font-medium text-slate-900">{circular.titulo}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <span className="text-sm text-slate-600 capitalize">
                              {circular.tipo_comunicado || 'General'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <span className="text-sm text-slate-600">
                              {circular.fecha_vigencia_inicio || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expandedId === circular.id ? null : circular.id)
                              }
                              className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
                            >
                              {expandedId === circular.id ? 'Ocultar' : 'Ver Detalles'}
                            </button>
                          </td>
                        </tr>

                        {expandedId === circular.id && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={4} className="px-4 py-4">
                              <div className="rounded-xl border border-slate-200 bg-white p-6">
                                <div className="mb-4 border-b border-slate-200 pb-4">
                                  <h3 className="text-lg font-semibold text-[#0b2545]">
                                    {circular.titulo}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <StatusBadge status={circular.estado} size="sm" />
                                    <span className="text-sm text-slate-600">
                                      Categoría: {circular.categoria}
                                    </span>
                                    {circular.fecha_vigencia_fin && (
                                      <span className="text-sm text-slate-600">
                                        Vigente hasta: {circular.fecha_vigencia_fin}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h4 className="mb-2 font-semibold text-slate-900">
                                      Contenido
                                    </h4>
                                    <p className="whitespace-pre-wrap text-slate-700">
                                      {circular.contenido}
                                    </p>
                                  </div>

                                  {circular.detalle && (
                                    <div>
                                      <h4 className="mb-2 font-semibold text-slate-900">
                                        Detalles Adicionales
                                      </h4>
                                      <p className="whitespace-pre-wrap text-slate-700">
                                        {circular.detalle}
                                      </p>
                                    </div>
                                  )}

                                  {circular.archivo_adjunto && (
                                    <div>
                                      <h4 className="mb-2 font-semibold text-slate-900">
                                        Archivo Adjunto
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={() => handleDownload(circular)}
                                        disabled={downloadingId === circular.id}
                                        className="inline-flex items-center rounded-md bg-[#e6f1fb] px-3 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#d0e6f7] disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {downloadingId === circular.id ? 'Descargando...' : 'Descargar Archivo'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
