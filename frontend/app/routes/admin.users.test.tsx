import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "~/types/user";

import AdminUsers, { clientLoader } from "./admin.users";

const users: User[] = [
  {
    id: 1,
    email: "eoengineer@gmail.com",
    first_name: "Eric",
    last_name: "Oligney",
    admin: true,
  },
  {
    id: 2,
    email: "member@example.com",
    first_name: "Member",
    last_name: "User",
    admin: false,
  },
];

const fetchUsersMock = vi.fn<() => Promise<User[]>>();

vi.mock("~/lib/admin/users.api", () => ({
  fetchUsers: () => fetchUsersMock(),
}));

function renderAdminUsers(loaderUsers: User[] = users): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: "/admin/users",
        element: <AdminUsers />,
        loader: () => ({ users: loaderUsers }),
      },
      {
        path: "/admin/users/:id",
        element: <div>User show</div>,
      },
    ],
    { initialEntries: ["/admin/users"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("AdminUsers clientLoader", () => {
  beforeEach(() => {
    fetchUsersMock.mockReset();
  });

  it("returns users from the admin API", async () => {
    fetchUsersMock.mockResolvedValue(users);

    await expect(clientLoader()).resolves.toEqual({ users });
    expect(fetchUsersMock).toHaveBeenCalledOnce();
  });
});

describe("AdminUsers", () => {
  it("renders table headers and user rows", async () => {
    renderAdminUsers();

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByText("eoengineer@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Eric Oligney")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("shows an empty state when there are no users", async () => {
    renderAdminUsers([]);

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("navigates to the user show route when a row is clicked", async () => {
    const user = userEvent.setup();
    const router = renderAdminUsers();

    await screen.findByText("eoengineer@gmail.com");
    await user.click(screen.getByText("eoengineer@gmail.com"));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/users/1");
    });
  });
});
