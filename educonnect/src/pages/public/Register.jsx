import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';

const inputBase = {
  border: '0.5px solid #d8dae0',
  background: '#fafbfc',
  color: '#0b2545',
};

function Field({ label, children }) {
  return (
    <div>
      <label
        className="block text-xs font-medium uppercase tracking-wide mb-1.5"
        style={{ color: '#4a5060' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
      style={inputBase}
      onFocus={(e) => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,.1)'; e.target.style.background = '#fff'; }}
      onBlur={(e) => { e.target.style.borderColor = '#d8dae0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc'; }}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
      style={inputBase}
      onFocus={(e) => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,.1)'; }}
      onBlur={(e) => { e.target.style.borderColor = '#d8dae0'; e.target.style.boxShadow = 'none'; }}
    >
      {children}
    </select>
  );
}

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
    rol: 'estudiante',
  });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await executeRegister(formData);
    if (result.success) navigate('/login');
  };

  return (
    <div
      className="w-full max-w-md rounded-xl p-8 border"
      style={{ background: '#fff', borderColor: '#e2e4e9' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src="https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg"
            alt="logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-medium" style={{ color: '#0b2545' }}>EduConnect</span>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#378add' }}>
        Nueva cuenta
      </p>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#0b2545' }}>Registrarse</h2>
      <p className="text-xs leading-relaxed mb-5" style={{ color: '#8a8f9e' }}>
        Completá el formulario con tus datos institucionales.
      </p>

      {error && (
        <div
          className="text-xs rounded-lg px-3 py-2.5 mb-4"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid #fecaca' }}
        >
          {error.message || 'No fue posible registrar el usuario'}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <StyledInput type="text" name="nombre"  onChange={handleChange} required />
          </Field>
          <Field label="Primer apellido">
            <StyledInput type="text" name="primer_apellido"  onChange={handleChange} required />
          </Field>
        </div>

        <Field label="Identificación (cédula)">
          <StyledInput type="text" name="username"  onChange={handleChange} required />
        </Field>

        <Field label="Correo electrónico">
          <StyledInput type="email" name="email"  onChange={handleChange} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de nacimiento">
            <StyledInput type="date" name="fecha_nacimiento" onChange={handleChange} required />
          </Field>
          <Field label="Género">
            <StyledSelect name="genero" onChange={handleChange} required>
              <option value="">Seleccioná...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </StyledSelect>
          </Field>
        </div>

        <Field label="Contraseña">
          <StyledInput type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity mt-1"
          style={{ background: '#0b2545', opacity: loading ? .6 : 1 }}
        >
          {loading ? 'Procesando...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-xs text-center mt-4" style={{ color: '#8a8f9e' }}>
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium" style={{ color: '#378add' }}>
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
