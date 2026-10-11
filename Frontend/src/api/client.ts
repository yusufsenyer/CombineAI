import { tokenStorage } from '../auth/tokenStorage';
import { API_BASE_URL, API_V1_URL } from '../config/env';

// Dev-only, one-time: confirm EXPO_PUBLIC_API_URL is actually picked up.
if (__DEV__) {
  console.log(`[API] base URL: ${API_BASE_URL}`);
}

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
  const method = (options.method ?? 'GET').toUpperCase();
  let res: Response;

  try {
    res = await performRequest(path, options);

    if (res.status === 401) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        res = await performRequest(path, options);
      }
    }
  } catch (e) {
    // Network-level failure (server unreachable, DNS, timeout...). No token/body is logged.
    if (__DEV__) {
      console.log(`[API ERROR] ${method} ${path} -> network error (${API_V1_URL}${path})`);
    }
    throw e;
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

    if (__DEV__) {
      console.log(`[API ERROR] ${method} ${path} -> ${res.status} ${JSON.stringify({ code, message })}`);
    }

    throw new ApiError(code, message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
