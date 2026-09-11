import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "~/types/user";

const fetchMock = vi.fn<typeof fetch>();

vi.stubGlobal("fetch", fetchMock);

const sampleUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchUsers", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.resetModules();
  });

  it("returns the user list from GET /admin/users", async () => {
    const { fetchUsers } = await import("~/lib/admin/users.api");

    fetchMock.mockResolvedValue(jsonResponse([sampleUser], 200));

    await expect(fetchUsers()).resolves.toEqual([sampleUser]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/admin\/users$/),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("throws ApiError when the request fails", async () => {
    const { fetchUsers } = await import("~/lib/admin/users.api");

    fetchMock.mockResolvedValue(jsonResponse({ error: "Forbidden" }, 403));

    await expect(fetchUsers()).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Forbidden",
    });
  });
});

describe("fetchUser", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.resetModules();
  });

  it("returns a user from GET /admin/users/:id", async () => {
    const { fetchUser } = await import("~/lib/admin/users.api");

    fetchMock.mockResolvedValue(jsonResponse(sampleUser, 200));

    await expect(fetchUser("1")).resolves.toEqual(sampleUser);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/admin\/users\/1$/),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("throws ApiError when the request fails", async () => {
    const { fetchUser } = await import("~/lib/admin/users.api");

    fetchMock.mockResolvedValue(jsonResponse({ error: "Not Found" }, 404));

    await expect(fetchUser("999")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Not Found",
    });
  });
});
