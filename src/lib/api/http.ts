import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiEnvelope, RefreshTokenResponse } from "@/types/auth";
import { useAuthStore } from "@/store/auth-store";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ---- attach access token on every request ----
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ---- unwrap the {success,message,data} envelope, throw a clean Error otherwise ----
export function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

/** Human-readable message extraction, used by the UI to show toast errors. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0];
      if (first) return first;
    }
  }
  return fallback;
}

// ---- single-flight refresh-token queue so concurrent 401s don't fire N refresh calls ----
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<ApiEnvelope<RefreshTokenResponse>>(
      `${API_BASE_URL}/user/auth/refresh-token`,
      { refresh_token: refreshToken },
    );
    const tokens = unwrap(data);
    useAuthStore.getState().setTokens(tokens);
    return tokens.access_token;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      refreshPromise ??= performRefresh().finally(() => {
        refreshPromise = null;
      });

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return http(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
