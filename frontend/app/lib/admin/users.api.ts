import { apiUrl, defaultHeaders, parseApiError } from "~/lib/http";
import type { User } from "~/types/user";

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(apiUrl("/admin/users"), {
    method: 'GET',
    headers: defaultHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as User[];
}

export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(apiUrl(`/admin/users/${id}`), {
    method: 'GET',
    headers: defaultHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as User;
}