import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "~/types/user";

import AppNavbar from "./AppNavbar";

const currentUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const logoutMock = vi.fn<() => Promise<void>>();

vi.mock("~/lib/api", () => ({
  logout: () => logoutMock(),
}));

function renderNavbar(user: User | null): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AppNavbar user={user} />,
      },
      {
        path: "/login",
        element: <div>Login page</div>,
      },
      {
        path: "/register",
        element: <div>Register page</div>,
      },
    ],
    { initialEntries: ["/"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("AppNavbar", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    logoutMock.mockResolvedValue(undefined);
  });

  it("shows only Login and Register links for guests", () => {
    renderNavbar(null);

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle navigation" })).toBeInTheDocument();
  });

  it("shows only Log out for authenticated users", () => {
    renderNavbar(currentUser);

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });

  it("logs out and navigates to /login", async () => {
    const user = userEvent.setup();
    const router = renderNavbar(currentUser);

    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledOnce();
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
