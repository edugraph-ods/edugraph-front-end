import { useCallback } from "react";

type SignInPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:8000";

const resolveApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_API_BASE_URL;
  const trimmedBase = envBase.trim();

  if (trimmedBase.length === 0) {
    return DEFAULT_API_BASE_URL;
  }

  return trimmedBase.endsWith("/") ? trimmedBase.slice(0, -1) : trimmedBase;
};

const API_BASE_URL = resolveApiBase();

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
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

        if ("error" in data) {
          const { error } = data as { error?: unknown };
          if (typeof error === "string") return error;
        }

        if ("errors" in data) {
          const { errors } = data as { errors?: unknown };

          if (Array.isArray(errors) && errors.length > 0) {
            const [first] = errors;

            if (typeof first === "string") return first;

            if (first && typeof first === "object" && first !== null && "message" in first) {
              const { message: nestedMessage } = first as { message?: unknown };

              if (typeof nestedMessage === "string") return nestedMessage;
            }
          }
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

const request = async <TResponse>(path: string, payload: unknown): Promise<TResponse> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as TResponse;
  }

  return {} as TResponse;
};

export const useAuth = () => {
  const signIn = useCallback(async (payload: SignInPayload) => {
    return request("/api/v1/sign-in", payload);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    return request("/api/v1/sign-up", payload);
  }, []);

  return {
    signIn,
    signUp,
  };
};
