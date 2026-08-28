import type { JSX } from "react";
import { Outlet, redirect } from "react-router";

import { loadCurrentUser } from "~/lib/api";
import type { User } from "~/types/user";

export type AuthenticatedLoaderData = {
  user: User;
};

export async function clientLoader(): Promise<AuthenticatedLoaderData | Response> {
  const user = await loadCurrentUser();

  if (!user) {
    return redirect("/login");
  }

  return { user };
}

clientLoader.hydrate = true as const;

export default function AuthenticatedLayout(): JSX.Element {
  return <Outlet />;
}
