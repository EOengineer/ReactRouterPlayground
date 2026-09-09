import { ApiError } from "~/types/api";
import type { ApiErrorResponse } from "~/types/api";

export function apiBaseUrl(): string {
  const raw: unknown = import.meta.env.VITE_API_URL;
  return typeof raw === "string" ? raw.replace(/\/$/, "") : "";
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    return new ApiError(response.status, body);
  } catch {
    return new ApiError(response.status, null);
  }
}
