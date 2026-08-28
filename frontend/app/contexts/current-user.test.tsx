import { render, screen, waitFor } from "@testing-library/react";
import type { JSX } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentUserProvider, useCurrentUser } from "~/contexts/current-user";
import type { User } from "~/types/user";

const sampleUser: User = {
  id: 1,
  email: "eoengineer@gmail.com",
  first_name: "Eric",
  last_name: "Oligney",
  admin: true,
};

const loadCurrentUserMock = vi.fn<() => Promise<User | null>>();
const loginMock = vi.fn<(credentials: { email: string; password: string }) => Promise<User>>();
const logoutMock = vi.fn<() => Promise<void>>();

vi.mock("~/lib/api", () => ({
  loadCurrentUser: () => loadCurrentUserMock(),
  login: (credentials: { email: string; password: string }) => loginMock(credentials),
  logout: () => logoutMock(),
}));

function CurrentUserProbe(): JSX.Element {
  const { user, status, isAuthenticated, isAdmin, can } = useCurrentUser();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? "none"}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
      <span data-testid="can-admin">{String(can("admin"))}</span>
    </div>
  );
}

describe("CurrentUserProvider", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
    loginMock.mockReset();
    logoutMock.mockReset();
    logoutMock.mockResolvedValue(undefined);
  });

  it("loads the current user on mount", async () => {
    loadCurrentUserMock.mockResolvedValue(sampleUser);

    render(
      <CurrentUserProvider>
        <CurrentUserProbe />
      </CurrentUserProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("ready");
    });

    expect(screen.getByTestId("email")).toHaveTextContent(sampleUser.email);
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("admin")).toHaveTextContent("true");
    expect(screen.getByTestId("can-admin")).toHaveTextContent("true");
  });

  it("throws when useCurrentUser is used outside the provider", () => {
    expect(() => {
      render(<CurrentUserProbe />);
    }).toThrow("useCurrentUser must be used within a CurrentUserProvider");
  });
});
