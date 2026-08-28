import type {
  AuthErrorResponse,
  LoginCredentials,
  RegistrationPayload,
} from "~/types/auth";
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

/** Dedupes concurrent /me calls from nested clientLoaders; not a session store. */
let inflightCurrentUser: Promise<User | null> | null = null;

export async function loadCurrentUser(): Promise<User | null> {
  if (inflightCurrentUser) {
    return inflightCurrentUser;
  }

  inflightCurrentUser = (async () => {
    try {
      return await fetchCurrentUser();
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  })().finally(() => {
    inflightCurrentUser = null;
  });

  return inflightCurrentUser;
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

export async function register(payload: RegistrationPayload): Promise<User> {
  const response = await fetch(apiUrl("/registration"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
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

export async function logout(): Promise<void> {
  const response = await fetch(apiUrl("/session"), {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseAuthError(response);
  }
}
