export default function Configuracion() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-sm text-gray-500">Ajustes de la cuenta y preferencias del sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Seguridad</h3>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Cambiar contraseña</button>
            <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-gray-300" /> Activar 2FA (mock)</label>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Apariencia</h3>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <label className="flex items-center gap-2"><input type="radio" name="theme" defaultChecked /> Claro</label>
            <label className="flex items-center gap-2"><input type="radio" name="theme" /> Oscuro</label>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700">Notificaciones</h3>
        <div className="mt-3 space-y-3 text-sm text-gray-700">
          <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-gray-300" defaultChecked /> Recordatorios de tareas</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-gray-300" /> Alertas de seguridad</label>
        </div>
        <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Guardar</button>
      </div>
    </div>
  );
}
