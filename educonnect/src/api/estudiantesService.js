import { api } from './authService';

export const fetchEstudiantes = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `api/v1/estudiantes/?${query}` : 'api/v1/estudiantes/';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error al obtener estudiantes');
  }
};
