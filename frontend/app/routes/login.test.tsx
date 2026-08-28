import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentUserProvider } from "~/contexts/current-user";
import { AuthApiError } from "~/types/auth";
import type { User } from "~/types/user";

import Login from "./login";

const email = "eoengineer@gmail.com";
const password = "password1234!";
const invalidCredentialsMessage = "Invalid email or password";

const loadCurrentUserMock = vi.fn<() => Promise<User | null>>();
const loginMock = vi.fn<(credentials: { email: string; password: string }) => Promise<User>>();

vi.mock("~/lib/api", () => ({
  loadCurrentUser: () => loadCurrentUserMock(),
  login: (credentials: { email: string; password: string }) => loginMock(credentials),
}));

function renderLogin(): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: "/login",
        element: (
          <CurrentUserProvider>
            <Login />
          </CurrentUserProvider>
        ),
      },
      { path: "/", element: <div>Home</div> },
    ],
    { initialEntries: ["/login"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("Login", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
    loadCurrentUserMock.mockResolvedValue(null);
    loginMock.mockReset();
  });

  it("renders email, password, and submit controls", async () => {
    renderLogin();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
    await waitFor(() => {
      expect(loadCurrentUserMock).toHaveBeenCalled();
    });
  });

  it("shows the API error message when login fails", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new AuthApiError(401, { error: invalidCredentialsMessage }));

    renderLogin();
    await waitFor(() => {
      expect(loadCurrentUserMock).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByTestId("login-error")).toHaveTextContent(
      invalidCredentialsMessage,
    );
    expect(loginMock).toHaveBeenCalledWith({ email, password });
  });

  it("navigates to / after a successful login", async () => {
    const user = userEvent.setup();
    const signedInUser: User = {
      id: 1,
      email,
      first_name: "Eric",
      last_name: "Oligney",
      admin: true,
    };
    loginMock.mockResolvedValue(signedInUser);

    const router = renderLogin();
    await waitFor(() => {
      expect(loadCurrentUserMock).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(loginMock).toHaveBeenCalledWith({ email, password });
  });
});
