import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';
import useSystemConfig from '../../hooks/useSystemConfig';

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

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const SOLO_NUMEROS = /^\d+$/;

function validarFormulario(data) {
  if (!SOLO_LETRAS.test(data.nombre) || data.nombre.trim().length < 2)
    return 'El nombre solo puede contener letras y debe tener al menos 2 caracteres.';
  if (!SOLO_LETRAS.test(data.primer_apellido) || data.primer_apellido.trim().length < 2)
    return 'El apellido solo puede contener letras y debe tener al menos 2 caracteres.';
  if (!SOLO_NUMEROS.test(data.username))
    return 'La cédula solo puede contener números.';
  if (data.username.length < 5 || data.username.length > 12)
    return 'La cédula debe tener entre 5 y 12 dígitos.';
  if (data.fecha_nacimiento) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(data.fecha_nacimiento) >= hoy)
      return 'La fecha de nacimiento no puede ser hoy ni una fecha futura.';
  }
  if (data.email && !data.email.toLowerCase().endsWith('@mep.go.cr'))
    return 'Solo se permiten correos institucionales @mep.go.cr.';
  return null;
}

export default function Register() {
  const navigate = useNavigate();
  const { branding } = useSystemConfig();
  const { executeRegister, loading, error } = useRegister();
  const [formData, setFormData] = useState({
    nombre: '',
    primer_apellido: '',
    username: '',
    email: '',
    password: '',
    fecha_nacimiento: '',
    genero: '',
  });
  const [validationError, setValidationError] = useState(null);
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    setValidationError(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validarFormulario(formData);
    if (err) { setValidationError(err); return; }
    const result = await executeRegister(formData);
    if (result.success) setRegistered(true);
  };

  if (registered) {
    const steps = [
      {
        n: 1,
        title: 'Enviá un correo a administración',
        desc: (
          <>
            Escribí a <strong>admin@mep.go.cr</strong> con asunto{' '}
            <em>"Activación de cuenta EduConnect"</em>. Incluí tu nombre completo y cédula.
            Si necesitás un rol especial (auxiliar, comité, etc.) indícalo en el mensaje.
          </>
        ),
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        ),
      },
      {
        n: 2,
        title: 'Administración revisa tu solicitud',
        desc: 'El equipo administrativo verificará que pertenezcas a la institución y te asignará el rol correspondiente (docente, auxiliar, miembro de comité, etc.).',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        n: 3,
        title: 'Recibís confirmación y acceso',
        desc: 'Una vez activada tu cuenta recibirás un correo de confirmación. Podrás iniciar sesión con tu cédula y contraseña registradas.',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        ),
      },
    ];

    return (
      <div className="w-full max-w-lg rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e2e4e9' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: '#f8faff', borderBottom: '1px solid #e2e4e9' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#dbeafe' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold" style={{ color: '#0b2545' }}>¡Cuenta creada exitosamente!</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Tu cuenta está <strong>pendiente de activación</strong> por administración.
          </p>
        </div>

        {/* Steps */}
        <div className="px-8 py-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#378add' }}>
            ¿Qué hacer ahora?
          </p>
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                {s.n}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {s.icon}
                  <p className="text-sm font-semibold" style={{ color: '#0b2545' }}>{s.title}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mx-8 mb-6 rounded-lg px-4 py-3 text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <strong>Nota:</strong> Solo el personal institucional con correo <strong>@mep.go.cr</strong> puede registrarse.
          Los estudiantes son creados directamente por administración.
        </div>

        <div className="px-8 pb-8">
          <Link
            to="/login"
            className="inline-block w-full py-2.5 rounded-lg text-sm font-medium text-white text-center"
            style={{ background: '#0b2545' }}
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md rounded-xl p-8 border"
      style={{ background: '#fff', borderColor: '#e2e4e9' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={branding.logo_url || 'https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg'}
            alt="logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-medium" style={{ color: '#0b2545' }}>{branding.app_name || 'EduConnect'}</span>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#378add' }}>
        Nueva cuenta
      </p>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#0b2545' }}>Registrarse</h2>
      <p className="text-xs leading-relaxed mb-3" style={{ color: '#8a8f9e' }}>
        Este registro es exclusivo para <strong style={{ color: '#0b2545' }}>docentes y personal institucional</strong> con correo <strong style={{ color: '#0b2545' }}>@mep.go.cr</strong>.
        Los estudiantes son creados por administración.
      </p>
      <div className="rounded-lg px-3 py-2 mb-4 text-xs" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
        Tu cuenta quedará <strong>pendiente de activación</strong> hasta que un administrador la revise y asigne tu rol.
      </div>

      {(validationError || error) && (
        <div
          className="text-xs rounded-lg px-3 py-2.5 mb-4"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid #fecaca' }}
        >
          {validationError || error?.message || 'No fue posible registrar el usuario'}
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
            <StyledInput
              type="date"
              name="fecha_nacimiento"
              max={new Date().toISOString().split('T')[0]}
              onChange={handleChange}
              required
            />
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
