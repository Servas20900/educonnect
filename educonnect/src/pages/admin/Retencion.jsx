import { Database } from 'lucide-react';
import useSystemConfig from '../../hooks/useSystemConfig';
import { DataTable, PageHeader, BtnEditar, BtnSecundario } from '../../components/ui';

export default function Retencion() {
  const { getCatalog } = useSystemConfig();
  const politicas = getCatalog('retencion_politicas', []);

  const tableColumns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (p) => <span className="font-medium text-slate-900">{p.nombre}</span>,
    },
    {
      key: 'retencion',
      label: 'Retención',
      render: (p) => <span className="text-slate-700">{p.retencion}</span>,
    },
    {
      key: 'accion',
      label: 'Acción',
      render: (p) => <span className="text-slate-700">{p.accion}</span>,
    },
    {
      key: 'alcance',
      label: 'Alcance',
      render: (p) => <span className="text-slate-600">{p.alcance}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <BtnEditar onClick={() => {}} />
          <BtnSecundario onClick={() => {}}>Eliminar</BtnSecundario>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Políticas de Retención"
        subtitle="Gestiona la retención y eliminación de datos."
        action={{ label: 'Nueva política', onClick: () => {} }}
      />

      <DataTable
        columns={tableColumns}
        data={politicas}
        pageSize={8}
        emptyMessage="No hay políticas de retención configuradas."
      />
    </div>
  );
}
