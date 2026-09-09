import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentUserProvider } from "~/contexts/current-user";
import { ApiError } from "~/types/api";
import type { RegistrationPayload } from "~/types/auth";
import type { User } from "~/types/user";

import Register from "./register";

const firstName = "New";
const lastName = "User";
const email = "new.user@example.com";
const password = "password1234!";
const validationErrors = ["Email has already been taken", "Password is too short"];
const joinedValidationErrors = validationErrors.join(", ");

const loadCurrentUserMock = vi.fn<() => Promise<User | null>>();
const registerMock =
  vi.fn<(payload: RegistrationPayload) => Promise<User>>();

vi.mock("~/lib/api", () => ({
  loadCurrentUser: () => loadCurrentUserMock(),
  register: (payload: RegistrationPayload) => registerMock(payload),
}));

const formValues: RegistrationPayload = {
  email,
  password,
  password_confirmation: password,
  first_name: firstName,
  last_name: lastName,
};

async function fillRegistrationForm(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByLabelText("First name"), firstName);
  await user.type(screen.getByLabelText("Last name"), lastName);
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.type(screen.getByLabelText("Confirm password"), password);
}

function renderRegister(): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: "/register",
        element: (
          <CurrentUserProvider>
            <Register />
          </CurrentUserProvider>
        ),
      },
      { path: "/login", element: <div>Login</div> },
      { path: "/", element: <div>Home</div> },
    ],
    { initialEntries: ["/register"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("Register", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
    loadCurrentUserMock.mockResolvedValue(null);
    registerMock.mockReset();
  });

  it("renders registration fields and submit control", async () => {
    renderRegister();

    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    await waitFor(() => {
      expect(loadCurrentUserMock).toHaveBeenCalled();
    });
  });

  it("shows API validation errors when registration fails", async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValue(
      new ApiError(422, { errors: validationErrors }),
    );

    renderRegister();
    await waitFor(() => {
      expect(loadCurrentUserMock).toHaveBeenCalled();
    });

    await fillRegistrationForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByTestId("register-error")).toHaveTextContent(
      joinedValidationErrors,
    );
    expect(registerMock).toHaveBeenCalledWith(formValues);
  });

  it("navigates to / after a successful registration", async () => {
    const user = userEvent.setup();
    const createdUser: User = {
      id: 2,
      email,
      first_name: firstName,
      last_name: lastName,
      admin: false,
    };
    registerMock.mockResolvedValue(createdUser);

    const router = renderRegister();
    await waitFor(() => {
      expect(loadCurrentUserMock).toHaveBeenCalled();
    });

    await fillRegistrationForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(registerMock).toHaveBeenCalledWith(formValues);
  });
});
