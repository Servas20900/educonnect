import { Shield, Trash2, AlertCircle, Clock, Database } from 'lucide-react';
import useSystemConfig from '../../hooks/useSystemConfig';
import Paginador from '../../components/ui/Paginador';

export default function Retencion() {
  const { getCatalog } = useSystemConfig();
  const politicas = getCatalog('retencion_politicas', []);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Políticas de Retención</h1>
          <p className="text-sm text-gray-600">Gestiona la retención y eliminación de datos</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Retención y Archivo</h2>
          <p className="text-sm text-gray-500">Define políticas de retención, borrado y archivado.</p>
        </div>
        <button className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#0c447c]">Nueva política</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Paginador items={politicas} itemsPorPagina={8}>
          {(itemsPaginados) => (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Retención</th>
                    <th className="px-3 py-2">Acción</th>
                    <th className="px-3 py-2">Alcance</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemsPaginados.map((p) => (
                    <tr key={p.id} className="hover:bg-[#e6f1fb]">
                      <td className="px-3 py-2 font-medium text-slate-900">{p.nombre}</td>
                      <td className="px-3 py-2 text-slate-700">{p.retencion}</td>
                      <td className="px-3 py-2 text-slate-700">{p.accion}</td>
                      <td className="px-3 py-2 text-slate-600">{p.alcance}</td>
                      <td className="px-3 py-2 space-x-2">
                        <button className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0c447c]">Editar</button>
                        <button className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Paginador>
      </div>
    </div>
  );
}
