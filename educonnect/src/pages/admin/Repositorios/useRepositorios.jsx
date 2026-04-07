import { useCallback, useState } from 'react';
import {
  fetchRepositorios,
  fetchItemsByObject,
  uploadDocumentoGenerico,
  createRepositorio,
  updateRepositorio,
  deleteRepositorio,
  updateDocumentoRepositorio,
  archivarDocumentoRepositorio,
  desarchivarDocumentoRepositorio,
} from '../../../api/repositorios';
import { fetchRoles } from '../../../api/permisosService';

const MODELO_REPOSITORIO = 'documentosrepositorio';

export function useRepositorios() {
  const [repositorios, setRepositorios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loadingRepositorios, setLoadingRepositorios] = useState(false);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const cargarRepositorios = useCallback(async () => {
    setLoadingRepositorios(true);
    setError(null);
    try {
      const data = await fetchRepositorios();
      setRepositorios(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingRepositorios(false);
    }
  }, []);

  const cargarDocumentosRepositorio = useCallback(async (repositorioId, options = {}) => {
    setLoadingDocumentos(true);
    setError(null);
    try {
      const data = await fetchItemsByObject(MODELO_REPOSITORIO, repositorioId, options);
      setDocumentos(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingDocumentos(false);
    }
  }, []);

  const cargarRoles = useCallback(async () => {
    try {
      const data = await fetchRoles();
      setRoles(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const crearRepositorio = useCallback(async (repoData) => {
    setSaving(true);
    setError(null);
    try {
      const response = await createRepositorio(repoData);
      await cargarRepositorios();
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarRepositorios]);

  const actualizarRepositorioPermisos = useCallback(async (repositorioId, data) => {
    setSaving(true);
    setError(null);
    try {
      const response = await updateRepositorio(repositorioId, data);
      await cargarRepositorios();
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarRepositorios]);

  const eliminarRepositorio = useCallback(async (repositorioId) => {
    setSaving(true);
    setError(null);
    try {
      const response = await deleteRepositorio(repositorioId);
      await cargarRepositorios();
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarRepositorios]);

  const subirDocumento = useCallback(async (repositorioId, archivo, descripcion = '') => {
    setSaving(true);
    setError(null);
    try {
      const nuevo = await uploadDocumentoGenerico(MODELO_REPOSITORIO, repositorioId, archivo, descripcion);
      await cargarDocumentosRepositorio(repositorioId);
      return nuevo;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarDocumentosRepositorio]);

  const actualizarDocumento = useCallback(async (repositorioId, documentoId, data) => {
    setSaving(true);
    setError(null);
    try {
      const actualizado = await updateDocumentoRepositorio(repositorioId, documentoId, data);
      await cargarDocumentosRepositorio(repositorioId);
      return actualizado;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarDocumentosRepositorio]);

  const archivarDocumento = useCallback(async (repositorioId, documentoId, options = {}) => {
    setSaving(true);
    setError(null);
    try {
      const result = await archivarDocumentoRepositorio(repositorioId, documentoId);
      await cargarDocumentosRepositorio(repositorioId, options);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarDocumentosRepositorio]);

  const desarchivarDocumento = useCallback(async (repositorioId, documentoId, options = {}) => {
    setSaving(true);
    setError(null);
    try {
      const result = await desarchivarDocumentoRepositorio(repositorioId, documentoId);
      await cargarDocumentosRepositorio(repositorioId, options);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarDocumentosRepositorio]);

  return {
    repositorios,
    documentos,
    roles,
    loadingRepositorios,
    loadingDocumentos,
    saving,
    error,
    cargarRepositorios,
    cargarDocumentosRepositorio,
    cargarRoles,
    crearRepositorio,
    actualizarRepositorioPermisos,
    eliminarRepositorio,
    subirDocumento,
    actualizarDocumento,
    archivarDocumento,
    desarchivarDocumento,
  };
}
