// Backend bilan ishlash uchun yagona klient.
// Barcha so'rovlar /api/v1/* ga yuboriladi, next.config.ts dagi rewrite ularni
// backendga (default: http://localhost:3000) proksi qiladi.

export const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Body = Record<string, unknown> | FormData | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Body;
  /** 401 bo'lsa refresh qilib qayta urinmaslik (auth endpointlari uchun) */
  skipRefresh?: boolean;
}

let refreshing: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_PREFIX}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, { method = "GET", body }: RequestOptions) {
  const isForm = body instanceof FormData;
  return fetch(`${API_PREFIX}${path}`, {
    method,
    credentials: "include",
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
}

async function parse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await send(path, options);
  } catch {
    throw new ApiError(0, "Serverga ulanib bo'lmadi. Backend ishlayotganini tekshiring.");
  }

  if (res.status === 401 && !options.skipRefresh) {
    const ok = await refreshSession();
    if (!ok) {
      onSessionExpired?.();
      throw new ApiError(401, "Sessiya muddati tugadi. Qaytadan kiring.");
    }
    res = await send(path, options);
  }

  const json = await parse(res);

  if (!res.ok) {
    const message =
      (json && typeof json === "object" && "message" in json && String(json.message)) ||
      (res.status >= 500
        ? "Serverda xatolik yuz berdi"
        : res.status === 429
          ? "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring."
          : "So'rovni bajarib bo'lmadi");
    throw new ApiError(res.status, message, json?.code);
  }

  // Backend odatda { statusCode, data } qaytaradi, ba'zi endpointlar esa to'g'ridan-to'g'ri obyekt.
  if (json && typeof json === "object" && "statusCode" in json && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: Body, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { method: "POST", body, ...opts }),
  patch: <T>(path: string, body?: Body) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/**
 * Backend fayl URL'larini (masalan http://localhost:3000/api/v1/uploads/x.webp)
 * frontend orqali proksi qilinadigan nisbiy yo'lga aylantiradi.
 * Backend helmet ishlatgani uchun boshqa portdan rasm yuklash bloklanadi.
 */
export function mediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const idx = url.indexOf(API_PREFIX);
  if (idx >= 0) return url.slice(idx);
  if (/^https?:\/\//.test(url)) {
    // BASE_URL prefikssiz bo'lsa — fayl nomini uploads ostidan olamiz
    const name = url.split("/").pop();
    return name ? `${API_PREFIX}/uploads/${name}` : null;
  }
  return url.startsWith("/") ? url : `${API_PREFIX}/uploads/${url}`;
}
