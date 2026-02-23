import { useState, useCallback } from "react";

export function usePlaneamientos() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // por ahora dummy para que compile
      setPlanes([]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { planes, loading, error, cargar };
}