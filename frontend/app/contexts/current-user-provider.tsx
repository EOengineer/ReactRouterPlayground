import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from "react";

import {
  CurrentUserContext,
  type AuthStatus,
  type CurrentUserContextValue,
  type CurrentUserPermission,
} from "~/contexts/current-user-context";
import * as api from "~/lib/api";
import type { LoginCredentials, RegistrationPayload } from "~/types/auth";
import type { User } from "~/types/user";

export function CurrentUserProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applyUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    setStatus("ready");
  }, []);

  const refresh = useCallback(async () => {
    applyUser(await api.loadCurrentUser());
  }, [applyUser]);

  useEffect(() => {
    let active = true;

    void api.loadCurrentUser().then((nextUser) => {
      if (active) {
        applyUser(nextUser);
      }
    });

    return () => {
      active = false;
    };
  }, [applyUser]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      applyUser(await api.login(credentials));
    },
    [applyUser],
  );

  const register = useCallback(
    async (payload: RegistrationPayload) => {
      applyUser(await api.register(payload));
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    await api.logout();
    applyUser(null);
  }, [applyUser]);

  const isAuthenticated = user !== null;
  const isAdmin = user?.admin === true;

  const permissions = useMemo(
    (): Record<CurrentUserPermission, boolean> => ({
      admin: isAdmin,
    }),
    [isAdmin],
  );

  const can = useCallback(
    (permission: CurrentUserPermission): boolean => permissions[permission],
    [permissions],
  );

  const value = useMemo(
    (): CurrentUserContextValue => ({
      user,
      status,
      isAuthenticated,
      isAdmin,
      can,
      refresh,
      login,
      register,
      logout,
    }),
    [user, status, isAuthenticated, isAdmin, can, refresh, login, register, logout],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}
