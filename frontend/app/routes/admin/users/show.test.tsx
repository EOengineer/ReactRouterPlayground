import { render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
  type ClientLoaderFunctionArgs,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "~/types/user";

import AdminUserShow, { clientLoader } from "./show";

const sampleUser: User = {
  id: 42,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const memberUser: User = {
  id: 7,
  email: "member@example.com",
  first_name: "Member",
  last_name: "User",
  admin: false,
};

const fetchUserMock = vi.fn<(id: string) => Promise<User>>();

vi.mock("~/lib/admin/users.api", () => ({
  fetchUser: (id: string) => fetchUserMock(id),
}));

function loaderArgs(
  params: ClientLoaderFunctionArgs["params"],
): ClientLoaderFunctionArgs {
  return {
    params,
    request: new Request("http://localhost/admin/users"),
  } as ClientLoaderFunctionArgs;
}

function renderAdminUserShow(user: User = sampleUser): void {
  const router = createMemoryRouter(
    [
      {
        path: "/admin/users/:id",
        element: <AdminUserShow />,
        loader: () => ({ user }),
      },
    ],
    { initialEntries: [`/admin/users/${String(user.id)}`] },
  );

  render(<RouterProvider router={router} />);
}

describe("AdminUserShow clientLoader", () => {
  beforeEach(() => {
    fetchUserMock.mockReset();
  });

  it("fetches the user for the route id param", async () => {
    fetchUserMock.mockResolvedValue(sampleUser);

    await expect(clientLoader(loaderArgs({ id: "42" }))).resolves.toEqual({
      user: sampleUser,
    });

    expect(fetchUserMock).toHaveBeenCalledWith("42");
  });

  it("throws a 404 Response when the id param is missing", async () => {
    const result = clientLoader(loaderArgs({}));

    await expect(result).rejects.toBeInstanceOf(Response);
    await expect(result).rejects.toMatchObject({ status: 404 });
    expect(fetchUserMock).not.toHaveBeenCalled();
  });
});

describe("AdminUserShow", () => {
  it("renders the loaded user details for an admin", async () => {
    renderAdminUserShow(sampleUser);

    expect(await screen.findByRole("heading", { name: "Eric Oligney" })).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("eoengineer@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("renders a non-admin badge for members", async () => {
    renderAdminUserShow(memberUser);

    expect(await screen.findByRole("heading", { name: "Member User" })).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });
});
