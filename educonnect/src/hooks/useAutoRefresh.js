import { useEffect, useRef } from 'react';

// Llama fn() cada intervalMs milisegundos sin mostrar loading state.
// Usa ref para siempre tener la versión más reciente de fn.
export default function useAutoRefresh(fn, intervalMs = 30_000) {
  const ref = useRef(fn);
  ref.current = fn;

  useEffect(() => {
    const id = setInterval(() => ref.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
