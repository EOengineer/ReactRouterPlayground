import type { JSX } from "react";
import { Outlet, redirect } from "react-router";

import { loadCurrentUser } from "~/lib/api";

export async function clientLoader(): Promise<null | Response> {
  const user = await loadCurrentUser();

  if (user) {
    return redirect("/");
  }

  return null;
}

clientLoader.hydrate = true as const;

export default function GuestLayout(): JSX.Element {
  return <Outlet />;
}
