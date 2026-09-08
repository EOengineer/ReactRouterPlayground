import type { JSX } from 'react';
import { Outlet, redirect } from 'react-router';

import { loadCurrentUser } from '~/lib/api';
import type { User } from '~/types/user';

export type AdminLoaderData = {
    user: User;
}

export async function adminLoader(): Promise<AdminLoaderData | Response> {
  const user = await loadCurrentUser();

  if (!user) {
    return redirect('/login');
  }

  if (!!!user.admin) {
    return redirect('/');
  }

  return { user };
}


adminLoader.hydrate = true as const;

export default function AdminLayout(): JSX.Element {
  return <Outlet />;
}