"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

/** Charge une ressource au montage et expose un moyen de la recharger — évite de répéter le trio state/effect/catch sur chaque page. */
export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    apiFetch<T>(path)
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}
