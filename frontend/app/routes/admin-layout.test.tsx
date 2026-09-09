import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "~/types/api";
import type { User } from "~/types/user";

import AdminLayout, { clientLoader } from "./admin-layout";

const adminUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const memberUser: User = {
  ...adminUser,
  id: 2,
  email: "member@example.com",
  admin: false,
};

const loadCurrentUserMock = vi.fn<() => Promise<User | null>>();

vi.mock("~/lib/api", () => ({
  loadCurrentUser: () => loadCurrentUserMock(),
}));

function renderAdminShell(initialPath = "/admin"): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AdminLayout />,
        children: [
          { path: "admin", element: <h1>Admin</h1> },
          { path: "admin/users", element: <h1>Users</h1> },
          { path: "admin/sessions", element: <h1>Sessions</h1> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("AdminLayout clientLoader", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
  });

  it("returns the current user when the user is an admin", async () => {
    loadCurrentUserMock.mockResolvedValue(adminUser);

    await expect(clientLoader()).resolves.toEqual({ user: adminUser });
  });

  it("redirects to /login when unauthenticated", async () => {
    loadCurrentUserMock.mockResolvedValue(null);
    const { redirect } = await import("react-router");

    await expect(clientLoader()).resolves.toEqual(redirect("/login"));
  });

  it("redirects to / when the user is not an admin", async () => {
    loadCurrentUserMock.mockResolvedValue(memberUser);
    const { redirect } = await import("react-router");

    await expect(clientLoader()).resolves.toEqual(redirect("/"));
  });

  it("propagates unexpected load errors", async () => {
    loadCurrentUserMock.mockRejectedValue(new ApiError(500, { error: "Boom" }));

    await expect(clientLoader()).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    });
  });
});

describe("AdminLayout subnav", () => {
  it("renders Admin, Users, and Sessions links", () => {
    renderAdminShell();

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByRole("link", { name: "Sessions" })).toHaveAttribute(
      "href",
      "/admin/sessions",
    );
  });

  it("renders the nested route outlet content", () => {
    renderAdminShell("/admin/users");

    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });
});
