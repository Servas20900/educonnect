import { useEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import useSystemConfig from '../../hooks/useSystemConfig';
import { api, changePassword } from '../../api/authService';

export default function Perfil() {
  const { username, role } = useAuth();
  const { branding } = useSystemConfig();
  const fileInputRef = useRef(null);

  const storageKey = `perfil_foto_${username || 'default'}`;

  const [message, setMessage] = useState({ type: '', text: '' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [userInfo, setUserInfo] = useState({ full_name: '', email: '' });
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const profileData = useMemo(
    () => ({
      full_name: userInfo.full_name || 'Cargando...',
      username: username || 'admin',
      email: userInfo.email || '',
      role: role || 'Administrador',
      created_since: 'abril 2026',
    }),
    [username, role, userInfo]
  );

  useEffect(() => {
    const savedPhoto = localStorage.getItem(storageKey);
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, [storageKey]);

  useEffect(() => {
    let active = true;
    const loadCurrentUserInfo = async () => {
      if (!username) { setLoadingUserInfo(false); return; }
      try {
        const response = await api.get('api/v1/permisos/usuarios/');
        const users = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.results) ? response.data.results : [];
        const currentUser = users.find((u) => u.username === username);
        if (!active) return;
        setUserInfo({
          full_name: currentUser?.persona?.nombre_completo || username,
          email: currentUser?.email || '',
        });
      } catch {
        if (!active) return;
        setUserInfo({ full_name: username, email: '' });
        setMessage({ type: 'info', text: 'No se pudieron cargar todos los datos del perfil.' });
      } finally {
        if (active) setLoadingUserInfo(false);
      }
    };
    loadCurrentUserInfo();
    return () => { active = false; };
  }, [username]);

  const initials = (profileData.full_name || 'AD')
    .split(/[.\s_-]+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  const handlePhotoButtonClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Selecciona un archivo de imagen válido.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar los 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPhotoPreview(base64);
      localStorage.setItem(storageKey, base64);
      setMessage({ type: 'success', text: 'Foto de perfil actualizada correctamente.' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    localStorage.removeItem(storageKey);
    setMessage({ type: 'info', text: 'La foto de perfil fue eliminada.' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setMessage({ type: 'error', text: 'Completa todos los campos de contraseña.' });
      return;
    }
    if (passwords.next.length < 8) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setMessage({ type: 'error', text: 'La confirmación de la nueva contraseña no coincide.' });
      return;
    }
    try {
      setSavingPassword(true);
      await changePassword({
        current_password: passwords.current,
        new_password: passwords.next,
        confirm_password: passwords.confirm,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'No se pudo actualizar la contraseña.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Visual helpers ──────────────────────────────────────────────────────────

  const msgCfg = {
    success: { bg: '#ecfdf3', border: '#bbf7d0', color: '#166534', icon: '✓' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '✕' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: 'i' },
  };

  const inputBase    = { borderColor: '#d8dae0', background: '#fafbfc', color: '#0b2545' };
  const inputDisabled = { borderColor: '#e9ecf2', background: '#f4f6fb', color: '#9ca3af', cursor: 'not-allowed' };
  const inputClass   = 'w-full rounded-lg border px-3 py-2 text-sm outline-none';

  const labelStyle = {
    display: 'block', marginBottom: 6,
    fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: '#8a8f9e',
  };

  const SectionHeader = ({ icon, label, iconBg, iconStroke }) => (
    <div
      className="px-6 py-4 border-b flex items-center gap-2"
      style={{ borderColor: '#f0f2f5', background: '#fafbfc' }}
    >
      <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon(iconStroke)}
      </span>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0b2545' }}>{label}</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Toast ── */}
      {message.text && (() => {
        const c = msgCfg[message.type] || msgCfg.info;
        return (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: c.color, color: '#fff' }}
            >
              {c.icon}
            </span>
            {message.text}
          </div>
        );
      })()}

      {/* ── Header card ── */}
      <section className="overflow-hidden rounded-xl border" style={{ background: '#fff', borderColor: '#e2e4e9' }}>
        <div className="grid grid-cols-1 lg:grid-cols-5">

          {/* Avatar + nombre */}
          <div className="lg:col-span-3 p-6 sm:p-8 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview} alt="Foto de perfil"
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ boxShadow: '0 0 0 3px #378add44' }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', boxShadow: '0 0 0 3px #378add33' }}
                >
                  <span className="text-xl font-bold tracking-tight" style={{ color: '#1d4ed8' }}>{initials}</span>
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white" style={{ background: '#22c55e' }} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#378add' }}>Mi perfil</p>
              <h1 className="text-xl font-semibold leading-tight" style={{ color: '#0b2545' }}>{profileData.full_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: '#dbeafe', color: '#1d4ed8' }}
                >
                  ⚙ {profileData.role}
                </span>
                <span className="text-xs" style={{ color: '#b0b7c3' }}>Activo desde {profileData.created_since}</span>
              </div>
            </div>
          </div>

          {/* Institución + foto */}
          <div
            className="lg:col-span-2 border-t lg:border-t-0 lg:border-l p-6 flex flex-col justify-between"
            style={{ borderColor: '#e9ecf2', background: '#fafbfc' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Institución</p>
              <p className="text-sm font-semibold leading-snug" style={{ color: '#0b2545' }}>
                {branding?.institution_name || 'Escuela Manuela Santamaria Rodriguez'}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

              <button
                type="button" onClick={handlePhotoButtonClick}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: '#0b2545' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {photoPreview ? 'Cambiar foto' : 'Subir foto'}
              </button>

              {photoPreview && (
                <button
                  type="button" onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium hover:bg-red-50 transition-colors"
                  style={{ border: '1px solid #fecaca', color: '#dc2626', background: '#fff' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Datos personales ── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e2e4e9' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#f0f2f5', background: '#fafbfc' }}>
          <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#dbeafe' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0b2545' }}>Datos personales</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input disabled value={loadingUserInfo ? 'Cargando...' : profileData.full_name} className={inputClass} style={inputDisabled} />
          </div>
          <div>
            <label style={labelStyle}>Correo electrónico</label>
            <input disabled value={loadingUserInfo ? 'Cargando...' : (profileData.email || 'Sin correo registrado')} className={inputClass} style={inputDisabled} />
          </div>
        </div>
      </section>

      {/* ── Rol ── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e2e4e9' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#f0f2f5', background: '#fafbfc' }}>
          <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#dbeafe' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0b2545' }}>Rol del usuario</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Rol asignado</label>
            <div className="flex items-center gap-3">
              <input disabled value={profileData.role} className={inputClass} style={inputDisabled} />
              <span
                className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: '#dbeafe', color: '#1d4ed8', whiteSpace: 'nowrap' }}
              >
                ⚙ {profileData.role}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seguridad ── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e2e4e9' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#f0f2f5', background: '#fafbfc' }}>
          <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#fef9c3' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0b2545' }}>Seguridad</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { name: 'current', label: 'Contraseña actual' },
              { name: 'next',    label: 'Nueva contraseña' },
              { name: 'confirm', label: 'Confirmar nueva contraseña' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="password" name={name}
                  value={passwords[name]}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={inputClass}
                  style={inputBase}
                  onFocus={(e) => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px #378add18'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#d8dae0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs" style={{ color: '#b0b7c3' }}>
            Mínimo 8 caracteres. Usá una combinación de letras, números y símbolos.
          </p>

          <div
            className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: '#f0f2f5' }}
          >
            <p className="text-xs" style={{ color: '#b0b7c3' }}>
              Tu sesión se mantendrá activa después del cambio.
            </p>
            <button
              type="button" onClick={handleUpdatePassword} disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity"
              style={{
                background: savingPassword ? '#94a3b8' : '#0b2545',
                cursor: savingPassword ? 'not-allowed' : 'pointer',
                opacity: savingPassword ? 0.75 : 1,
              }}
            >
              {savingPassword ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Actualizar contraseña
                </>
              )}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
