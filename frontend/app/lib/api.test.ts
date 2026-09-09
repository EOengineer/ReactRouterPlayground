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

describe("loadCurrentUser", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.resetModules();
  });

  it("fetches /me on each sequential call", async () => {
    const { loadCurrentUser } = await import("~/lib/api");

    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(sampleUser, 200)));

    await expect(loadCurrentUser()).resolves.toEqual(sampleUser);
    await expect(loadCurrentUser()).resolves.toEqual(sampleUser);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent /me calls into one request", async () => {
    const { loadCurrentUser } = await import("~/lib/api");

    let resolveFetch!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const first = loadCurrentUser();
    const second = loadCurrentUser();

    resolveFetch(jsonResponse(sampleUser, 200));

    await expect(first).resolves.toEqual(sampleUser);
    await expect(second).resolves.toEqual(sampleUser);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("maps 401 from /me to null", async () => {
    const { loadCurrentUser } = await import("~/lib/api");

    fetchMock.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

    await expect(loadCurrentUser()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rethrows unexpected auth errors", async () => {
    const { loadCurrentUser } = await import("~/lib/api");

    fetchMock.mockResolvedValue(jsonResponse({ error: "Boom" }, 500));

    await expect(loadCurrentUser()).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      message: "Boom",
    });
  });
});
