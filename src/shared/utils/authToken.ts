const AUTH_TOKEN_COOKIE = "auth-token";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export const readAuthToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith(`${AUTH_TOKEN_COOKIE}=`)) {
      return decodeURIComponent(part.substring(AUTH_TOKEN_COOKIE.length + 1));
    }
  }
  return null;
};

export const writeAuthToken = (token: string, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS): void => {
  if (typeof document === "undefined") return;
  const maxAge = Number.isFinite(maxAgeSeconds) ? Math.max(0, Math.floor(maxAgeSeconds)) : DEFAULT_MAX_AGE_SECONDS;
  const expires = maxAge > 0 ? `max-age=${maxAge}` : "";
  const cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; ${expires}`.trim();
  document.cookie = cookie;
};

export const clearAuthToken = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0`;
};

export const extractAuthToken = (payload: unknown): string | null => {
  if (!payload) return null;
  if (typeof payload === "string") {
    return payload.trim().length > 0 ? payload : null;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const token = extractAuthToken(item);
      if (token) return token;
    }
    return null;
  }
  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const directKeys = ["token", "accessToken", "access_token", "access"];
  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  for (const key of Object.keys(record)) {
    if (key.toLowerCase().includes("token")) {
      const value = record[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
  }

  const nestedKeys = ["data", "result", "payload", "tokens", "auth"];
  for (const key of nestedKeys) {
    const value = record[key];
    if (value && typeof value === "object") {
      const token = extractAuthToken(value);
      if (token) return token;
    }
  }

  return null;
};

export { AUTH_TOKEN_COOKIE };
