import { tokenStorage } from '../auth/tokenStorage';
import { API_V1_URL } from '../config/env';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStorage.getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_V1_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await tokenStorage.setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

async function performRequest(path: string, options: RequestInit): Promise<Response> {
  const access = await tokenStorage.getAccessToken();
  const headers = new Headers(options.headers ?? {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body != null && typeof options.body !== 'undefined') {
    headers.set('Content-Type', 'application/json');
  }
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  return fetch(`${API_V1_URL}${path}`, { ...options, headers });
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await performRequest(path, options);

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await performRequest(path, options);
    }
  }

  if (!res.ok) {
    let message = 'Bir şeyler ters gitti.';
    let code = 'unknown';
    try {
      const body = await res.json();
      if (body?.error) {
        message = body.error.message ?? message;
        code = body.error.code ?? code;
      }
    } catch {
      // non-JSON error body; keep defaults
    }
    throw new ApiError(code, message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
