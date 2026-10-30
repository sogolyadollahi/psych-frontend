const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function normalizeApiBaseUrl(value: string): string {
  const baseUrl = value.trim().replace(/\/+$/, "").replace(/\/docs$/i, "");
  return /\/api\/v1$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api/v1`;
}

const API_BASE_URL = normalizeApiBaseUrl(configuredApiBaseUrl);

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  authenticated?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { authenticated = true, headers: inputHeaders, ...init } = options;
  const headers = new Headers(inputHeaders);

  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Could not reach the Psych API. Check that the backend is running.", 0);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const body = payload as { detail?: string; error?: { message?: string } };
    const message =
      body?.detail ??
      body?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, authenticated = true) =>
    apiRequest<T>(path, { method: "GET", authenticated }),
  post: <T>(path: string, body?: unknown, authenticated = true) =>
    apiRequest<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      authenticated,
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
