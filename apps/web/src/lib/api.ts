export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const TOKEN_KEY = "defa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Lève une erreur avec le message renvoyé par l'API si la réponse n'est pas OK. */
async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await res.json().catch(() => ({}));
  throw new Error(body.error ?? `Erreur ${res.status}`);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
  });
  await throwIfNotOk(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Upload multipart (scan de facture) — pas de Content-Type manuel, le navigateur fixe la boundary. */
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: authHeaders(), body: formData });
  await throwIfNotOk(res);
  return res.json();
}

/** Récupère le PDF via fetch (l'endpoint exige un Bearer token, donc un lien direct ne fonctionne pas). */
export async function fetchDocumentPdfUrl(documentId: string): Promise<string> {
  const res = await fetch(`${API_URL}/documents/${documentId}/pdf`, { headers: authHeaders() });
  await throwIfNotOk(res);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
