const DEFAULT_API_BASE_URL = "http://localhost:8000";

const resolveApiBase = () => {
  const envBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    (DEFAULT_API_BASE_URL || "http://localhost:8000");
  const trimmedBase = envBase.trim();
  if (trimmedBase.length === 0) return DEFAULT_API_BASE_URL;
  return trimmedBase.endsWith("/") ? trimmedBase.slice(0, -1) : trimmedBase;
};

const API_BASE_URL = resolveApiBase();

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith("auth-token=")) {
      return decodeURIComponent(part.substring("auth-token=".length));
    }
  }
  return null;
};

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const data: unknown = await response.json();
      if (typeof data === "string") return data;
      if (data && typeof data === "object") {
        if ("message" in data) {
          const { message } = data as { message?: unknown };
          if (typeof message === "string") return message;
        }
        if ("detail" in data) {
          const { detail } = data as { detail?: unknown };
          if (typeof detail === "string") return detail;
        }
        if ("error" in data) {
          const { error } = data as { error?: unknown };
          if (typeof error === "string") return error;
        }
      }
    } catch {
      return "Unexpected error";
    }
  } else {
    const text = await response.text();
    if (text) return text;
  }
  return "Unexpected error";
};

type JsonInit = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export const getJson = async <T>(path: string, init?: JsonInit): Promise<T> => {
  const token = getToken();
  const url = buildUrl(path);
  // simple tracing
  console.debug("GET", url);
  const response = await fetch(buildUrl(path), {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  if (response.status === 204) return {} as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return {} as T;
};

export const postJson = async <T>(
  path: string,
  body: unknown,
  init?: JsonInit
): Promise<T> => {
  const token = getToken();
  const url = buildUrl(path);
  console.debug("POST", url, body);
  const response = await fetch(url, {
    method: init?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  if (response.status === 204) return {} as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return {} as T;
};
