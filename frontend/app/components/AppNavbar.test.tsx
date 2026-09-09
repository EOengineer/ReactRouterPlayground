import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentUserProvider } from "~/contexts/current-user";
import type { User } from "~/types/user";

import AppNavbar from "./AppNavbar";

const currentUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const memberUser: User = {
  ...currentUser,
  id: 2,
  email: "member@example.com",
  admin: false,
};

const loadCurrentUserMock = vi.fn<() => Promise<User | null>>();
const logoutMock = vi.fn<() => Promise<void>>();

vi.mock("~/lib/api", () => ({
  loadCurrentUser: () => loadCurrentUserMock(),
  logout: () => logoutMock(),
}));

function renderNavbar(): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <CurrentUserProvider>
            <AppNavbar />
          </CurrentUserProvider>
        ),
      },
      {
        path: "/login",
        element: <div>Login page</div>,
      },
      {
        path: "/register",
        element: <div>Register page</div>,
      },
      {
        path: "/admin",
        element: <div>Admin page</div>,
      },
    ],
    { initialEntries: ["/"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("AppNavbar", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
    logoutMock.mockReset();
    logoutMock.mockResolvedValue(undefined);
  });

  it("shows only Login and Register links for guests", async () => {
    loadCurrentUserMock.mockResolvedValue(null);
    renderNavbar();

    expect(await screen.findByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle navigation" })).toBeInTheDocument();
  });

  it("shows Log out for authenticated members without Admin", async () => {
    loadCurrentUserMock.mockResolvedValue(memberUser);
    renderNavbar();

    expect(await screen.findByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows Admin and Log out for authenticated admins", async () => {
    loadCurrentUserMock.mockResolvedValue(currentUser);
    renderNavbar();

    expect(await screen.findByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });

  it("logs out and navigates to /login", async () => {
    loadCurrentUserMock.mockResolvedValue(currentUser);
    const user = userEvent.setup();
    const router = renderNavbar();

    await screen.findByRole("button", { name: "Log out" });
    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledOnce();
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
