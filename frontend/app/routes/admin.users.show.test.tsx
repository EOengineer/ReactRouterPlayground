import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import AdminUserShow from "./admin.users.show";

describe("AdminUserShow", () => {
  it("renders the user id from the route params", async () => {
    const router = createMemoryRouter(
      [{ path: "/admin/users/:id", element: <AdminUserShow /> }],
      { initialEntries: ["/admin/users/42"] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "User 42" })).toBeInTheDocument();
  });
});
