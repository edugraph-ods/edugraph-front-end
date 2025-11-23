import { readAuthToken } from "@/shared/utils/authToken";

const DEFAULT_API_BASE_URL = "";
const HTTP_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_HTTP_TIMEOUT_MS || 45000);

const resolveApiBase = () => {
  const useAbsolute = (process.env.NEXT_PUBLIC_USE_ABSOLUTE_API || "").toLowerCase() === "true";
  const envBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    DEFAULT_API_BASE_URL;
  const trimmedBase = envBase.trim();
  if (!useAbsolute) return "";
  if (trimmedBase.length === 0) return "";
  return trimmedBase.endsWith("/") ? trimmedBase.slice(0, -1) : trimmedBase;
};

const buildErrorMessage = async (
  response: Response,
  method: string,
  url: string
): Promise<string> => {
  const parsed = await parseErrorMessage(response);
  const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
  return `[${method}] ${url} -> ${status}: ${parsed}`;
};

const API_BASE_URL = resolveApiBase();

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  let timedOut = false;
  const id = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(input, { ...(init || {}), signal: controller.signal });
    return response;
  } catch (err) {
    if (timedOut) {
      throw new Error(`Request timeout after ${HTTP_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
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
          if (Array.isArray(detail)) {
            const first = detail[0];
            if (first && typeof first === "object") {
              const msg = (first as { msg?: unknown }).msg;
              if (typeof msg === "string") return msg;
              const loc = Array.isArray((first as { loc?: unknown }).loc)
                ? ((first as { loc?: unknown }).loc as unknown[]).join(", ")
                : "";
              const message = typeof (first as { message?: unknown }).message === "string"
                ? ((first as { message?: unknown }).message as string)
                : "";
              if (message || loc) {
                return [message, loc].filter(Boolean).join(" - ");
              }
            }
            return detail.map((item) => {
              if (typeof item === "string") return item;
              if (item && typeof item === "object") {
                const msg = (item as { msg?: unknown }).msg;
                if (typeof msg === "string") return msg;
              }
              return "Validation error";
            }).join("; ");
          }
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

export type JsonInit = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export const getJson = async <T>(path: string, init?: JsonInit): Promise<T> => {
  const token = readAuthToken();
  const url = buildUrl(path);
  console.debug("GET", url);
  const response = await fetchWithTimeout(buildUrl(path), {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const message = await buildErrorMessage(response, init?.method ?? "GET", url);
    throw new Error(message);
  }
  if (response.status === 204) return {} as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return {} as T;
};

export const getJsonPublic = async <T>(path: string, init?: JsonInit): Promise<T> => {
  const url = buildUrl(path);
  console.debug("GET (public)", url, "headers:", init?.headers);
  
  try {
    const response = await fetch(buildUrl(path), {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "omit", 
    });
    
    console.debug("Response status:", response.status, response.statusText);
    console.debug("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const message = await buildErrorMessage(response, init?.method ?? "GET", url);
      throw new Error(message);
    }
    if (response.status === 204) return {} as T;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return {} as T;
  } catch (error) {
    console.error("Public fetch failed, trying with timeout:", error);
    const response = await fetchWithTimeout(buildUrl(path), {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    console.debug("Fallback response status:", response.status, response.statusText);
    if (!response.ok) {
      const message = await buildErrorMessage(response, init?.method ?? "GET", url);
      throw new Error(message);
    }
    if (response.status === 204) return {} as T;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return {} as T;
  }
};

export const requestJson = async <T>(
  path: string,
  body: unknown,
  init?: JsonInit
): Promise<T> => {
  const token = readAuthToken();
  const url = buildUrl(path);
  console.debug("REQUEST", url, body);
  const response = await fetchWithTimeout(url, {
    method: init?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const message = await buildErrorMessage(response, init?.method ?? "POST", url);
    throw new Error(message);
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
  const token = readAuthToken();
  const url = buildUrl(path);
  console.debug("POST", url, body);
  const response = await fetchWithTimeout(url, {
    method: init?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const message = await buildErrorMessage(response, init?.method ?? "POST", url);
    throw new Error(message);
  }
  if (response.status === 204) return {} as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return {} as T;
};
