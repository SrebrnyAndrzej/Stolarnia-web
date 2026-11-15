import { useEffect, useState } from "react";
import { request } from "./api";

export function useResource<T>(url: string | null, fallback?: T) {
  const [state, setState] = useState<{
    url: string | null;
    data: T | null;
    error: string;
    busy: boolean;
  }>({ url, data: null, error: "", busy: !!url });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setState({ url, data: null, error: "", busy: true });
    request<T>(url, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ url, data, error: "", busy: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            url,
            data: null,
            error: navigator.onLine
              ? (error as Error).message
              : "Brak połączenia. Sprawdź sieć i ponów.",
            busy: false,
          });
      });
    return () => controller.abort();
  }, [url, revision]);
  return {
    data: url ? (state.url === url ? state.data : null) : (fallback ?? null),
    busy: !!url && (state.url !== url || state.busy),
    error: state.url === url ? state.error : "",
    retry: () => setRevision((r) => r + 1),
  };
}
