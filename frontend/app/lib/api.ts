import type { AuthErrorResponse, LoginCredentials } from "~/types/auth";
import { AuthApiError } from "~/types/auth";
import type { User } from "~/types/user";

function apiBaseUrl(): string {
  const raw: unknown = import.meta.env.VITE_API_URL;
  return typeof raw === "string" ? raw.replace(/\/$/, "") : "";
}

function apiUrl(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

async function parseAuthError(response: Response): Promise<AuthApiError> {
  try {
    const body = (await response.json()) as AuthErrorResponse;
    return new AuthApiError(response.status, body);
  } catch {
    return new AuthApiError(response.status, null);
  }
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await fetch(apiUrl("/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  return (await response.json()) as User;
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch(apiUrl("/me"), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  return (await response.json()) as User;
}
