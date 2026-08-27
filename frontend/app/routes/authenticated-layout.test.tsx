import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthApiError } from "~/types/auth";
import type { User } from "~/types/user";

const sampleUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const loadCurrentUserMock = vi.fn<() => Promise<User | null>>();

vi.mock("~/lib/api", () => ({
  loadCurrentUser: () => loadCurrentUserMock(),
}));

describe("AuthenticatedLayout clientLoader", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
  });

  it("returns the current user when authenticated", async () => {
    loadCurrentUserMock.mockResolvedValue(sampleUser);
    const { clientLoader } = await import("./authenticated-layout");

    await expect(clientLoader()).resolves.toEqual({ user: sampleUser });
  });

  it("redirects to /login when unauthenticated", async () => {
    loadCurrentUserMock.mockResolvedValue(null);
    const { clientLoader } = await import("./authenticated-layout");
    const { redirect } = await import("react-router");

    await expect(clientLoader()).resolves.toEqual(redirect("/login"));
  });

  it("propagates unexpected load errors", async () => {
    loadCurrentUserMock.mockRejectedValue(new AuthApiError(500, { error: "Boom" }));
    const { clientLoader } = await import("./authenticated-layout");

    await expect(clientLoader()).rejects.toMatchObject({
      name: "AuthApiError",
      status: 500,
    });
  });
});
