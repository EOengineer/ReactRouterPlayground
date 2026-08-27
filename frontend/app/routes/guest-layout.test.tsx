import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("GuestLayout clientLoader", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
  });

  it("redirects to / when the user is authenticated", async () => {
    loadCurrentUserMock.mockResolvedValue(sampleUser);
    const { clientLoader } = await import("./guest-layout");
    const { redirect } = await import("react-router");

    await expect(clientLoader()).resolves.toEqual(redirect("/"));
  });

  it("allows the guest route when there is no user", async () => {
    loadCurrentUserMock.mockResolvedValue(null);
    const { clientLoader } = await import("./guest-layout");

    await expect(clientLoader()).resolves.toBeNull();
  });
});
