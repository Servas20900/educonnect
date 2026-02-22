import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';

export default function Register() {
  const navigate = useNavigate();
  const { executeRegister, loading, error } = useRegister();
  const [formData, setFormData] = useState({
    nombre: '',
    primer_apellido: '',
    username: '',
    email: '',
    password: '',
    fecha_nacimiento: '',
    genero: '',
    rol: 'estudiante'  // Rol por defecto
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await executeRegister(formData);
    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold">Crear cuenta</h2>
      {error && (
        <div className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded space-y-1">
          <p>{error.message || 'No fue posible registrar el usuario'}</p>
          {error.details && typeof error.details === 'object' && (
            <ul className="list-disc ml-5">
              {Object.entries(error.details).map(([field, value]) => (
                <li key={field}>
                  {field}: {Array.isArray(value) ? value.join(', ') : String(value)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Nombre</label>
            <input type="text" name="nombre" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Primer Apellido</label>
            <input type="text" name="primer_apellido" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Identificacion</label>
          <input type="text" name="username" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Correo electrónico</label>
          <input type="email" name="email" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Fecha de Nacimiento</label>
          <input type="date" name="fecha_nacimiento" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Género</label>
          <select name="genero" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white" required>
            <option value="">Seleccione...</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contraseña</label>
          <input type="password" name="password" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Procesando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}