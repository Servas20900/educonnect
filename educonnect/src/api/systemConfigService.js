import { api } from './authService';

export async function fetchSystemBootstrap() {
  const response = await api.get('api/v1/permisos/modulos/bootstrap/');
  return response.data;
}
