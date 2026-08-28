import { createContext, useContext } from "react";

import type { LoginCredentials, RegistrationPayload } from "~/types/auth";
import type { User } from "~/types/user";

export type AuthStatus = "loading" | "ready";

export type CurrentUserPermission = "admin";

export type CurrentUserContextValue = {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  can: (permission: CurrentUserPermission) => boolean;
  refresh: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegistrationPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }

  return context;
}
