export default function PublicHome(){
  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a EduConnect</h1>
        <p className="mt-3 text-gray-600">Gestiona tu comunidad educativa con una plataforma moderna y fácil de usar.</p>
        <div className="mt-6 flex gap-3">
          <a href="/login" className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Iniciar sesión</a>
          <a href="/register" className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Registrarse</a>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-sm text-gray-600">Circulares y avisos</p>
            <p className="mt-2 text-xl font-semibold text-indigo-700">Comunicación</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-4">
            <p className="text-sm text-gray-600">Horarios y reuniones</p>
            <p className="mt-2 text-xl font-semibold text-teal-700">Organización</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-sm text-gray-600">Evaluaciones y asistencia</p>
            <p className="mt-2 text-xl font-semibold text-rose-700">Seguimiento</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-gray-600">Reportes y seguridad</p>
            <p className="mt-2 text-xl font-semibold text-amber-700">Control</p>
          </div>
        </div>
      </div>
    </section>
  );
}
