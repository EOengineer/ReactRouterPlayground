import { render, screen } from "@testing-library/react";
import { redirect } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthApiError } from "~/types/auth";
import type { User } from "~/types/user";

import Home, { clientLoader } from "./_index";

const currentUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const fetchCurrentUserMock = vi.fn<() => Promise<User>>();

vi.mock("~/lib/api", () => ({
  fetchCurrentUser: () => fetchCurrentUserMock(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useLoaderData: (): User => currentUser,
  };
});

describe("Home", () => {
  it("renders Hello", () => {
    render(<Home />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("Home clientLoader", () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockReset();
  });

  it("returns the current user when authenticated", async () => {
    fetchCurrentUserMock.mockResolvedValue(currentUser);

    await expect(clientLoader()).resolves.toEqual(currentUser);
  });

  it("redirects to /login when unauthenticated", async () => {
    fetchCurrentUserMock.mockRejectedValue(
      new AuthApiError(401, { error: "Unauthorized" }),
    );

    await expect(clientLoader()).resolves.toEqual(redirect("/login"));
  });
});
