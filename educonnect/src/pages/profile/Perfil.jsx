export default function Perfil() {
  const user = { nombre: 'Usuario Demo', rol: 'Administrador', email: 'usuario@colegio.edu', telefono: '+506 8888 8888' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Perfil</h2>
        <p className="text-sm text-gray-500">Datos básicos del usuario.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Información</h3>
          <dl className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between"><dt className="text-gray-500">Nombre</dt><dd>{user.nombre}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Rol</dt><dd>{user.rol}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Correo</dt><dd>{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Teléfono</dt><dd>{user.telefono}</dd></div>
          </dl>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Preferencias rápidas</h3>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-gray-300" /> Notificaciones por correo</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-gray-300" defaultChecked /> Notificaciones en app</label>
          </div>
          <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Guardar</button>
        </div>
      </div>
    </div>
  );
}
