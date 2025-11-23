import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // mock login: navigate to admin dashboard
    navigate('/admin/dashboard');
  }

  return (
    
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="••••••" />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">¿Olvidaste tu contraseña?</div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Entrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
