import axios from 'axios';
import { api } from './authService';

const API_BASE = 'http://localhost:8000/api/v1/usuarios';

// ============ DOCENTES ============

export const fetchDocentes = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/docentes/`, {
      params,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching docentes:', error);
    throw error;
  }
};

export const fetchDocenteDetail = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/docentes/${id}/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching docente:', error);
    throw error;
  }
};

export const createDocente = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/docentes/`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating docente:', error);
    throw error;
  }
};

export const updateDocente = async (id, data) => {
  try {
    const response = await axios.patch(`${API_BASE}/docentes/${id}/`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating docente:', error);
    throw error;
  }
};

export const deleteDocente = async (id) => {
  try {
    await axios.delete(`${API_BASE}/docentes/${id}/`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error deleting docente:', error);
    throw error;
  }
};

export const fetchCatalogoDocentes = async () => {
  try {
    const response = await axios.get(`${API_BASE}/docentes/catalogo/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching catalogo docentes:', error);
    throw error;
  }
};

// ============ ESTUDIANTES ============

export const fetchEstudiantesUsuarios = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/estudiantes/`, {
      params,
      withCredentials: true,
    });
    const data = response.data;
    const list = Array.isArray(data) ? data : data?.results || [];

    // Fallback al endpoint estable si aún no hay registros materializados en /usuarios/estudiantes.
    if (list.length === 0) {
      const query = new URLSearchParams(params).toString();
      const url = query ? `api/v1/estudiantes/?${query}` : 'api/v1/estudiantes/';
      const fallbackResponse = await api.get(url);
      return fallbackResponse.data;
    }

    return data;
  } catch (error) {
    console.error('Error fetching estudiantes:', error);
    throw error;
  }
};

export const fetchEstudianteDetail = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/estudiantes/${id}/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching estudiante:', error);
    throw error;
  }
};

export const createEstudiante = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/estudiantes/`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating estudiante:', error);
    throw error;
  }
};

export const updateEstudiante = async (id, data) => {
  try {
    const response = await axios.patch(`${API_BASE}/estudiantes/${id}/`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating estudiante:', error);
    throw error;
  }
};

export const deleteEstudiante = async (id) => {
  try {
    await axios.delete(`${API_BASE}/estudiantes/${id}/`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error deleting estudiante:', error);
    throw error;
  }
};

export const fetchEstudiantesPorGrupo = async (grupoId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/estudiantes/por_grupo/`, {
      params: { grupo_id: grupoId, ...params },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching estudiantes por grupo:', error);
    throw error;
  }
};

// ============ GRADOS ============

export const fetchGrados = async () => {
  try {
    const response = await axios.get(`${API_BASE}/grados/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching grados:', error);
    throw error;
  }
};

// ============ GRUPOS ============

export const fetchGrupos = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/grupos/`, {
      params,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching grupos:', error);
    throw error;
  }
};

export const fetchGrupoDetail = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/grupos/${id}/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching grupo:', error);
    throw error;
  }
};

export const createGrupo = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/grupos/`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating grupo:', error);
    throw error;
  }
};

export const updateGrupo = async (id, data) => {
  try {
    const response = await axios.patch(`${API_BASE}/grupos/${id}/`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating grupo:', error);
    throw error;
  }
};

export const deleteGrupo = async (id) => {
  try {
    await axios.delete(`${API_BASE}/grupos/${id}/`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error deleting grupo:', error);
    throw error;
  }
};

export const fetchGruposPorGrado = async () => {
  try {
    const response = await axios.get(`${API_BASE}/grupos/por_grado/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching grupos por grado:', error);
    throw error;
  }
};

export const fetchEstudiantesGrupo = async (grupoId) => {
  try {
    const response = await axios.get(`${API_BASE}/grupos/${grupoId}/estudiantes/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching estudiantes de grupo:', error);
    throw error;
  }
};

export const asignarEstudianteGrupo = async (grupoId, estudianteId) => {
  try {
    const response = await axios.post(
      `${API_BASE}/grupos/${grupoId}/asignar_estudiante/`,
      { estudiante_id: estudianteId },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning student to group:', error);
    throw error;
  }
};

export const removerEstudianteGrupo = async (grupoId, estudianteId) => {
  try {
    const response = await axios.post(
      `${API_BASE}/grupos/${grupoId}/remover_estudiante/`,
      { estudiante_id: estudianteId },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error removing student from group:', error);
    throw error;
  }
};
