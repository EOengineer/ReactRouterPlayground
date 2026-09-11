import type { JSX } from "react";
import { Link, Outlet, redirect } from "react-router";
import { Container, Nav, NavItem, NavLink } from "reactstrap";

import { loadCurrentUser } from "~/lib/api";
import type { User } from "~/types/user";

export type AdminLoaderData = {
  user: User;
};

export async function clientLoader(): Promise<AdminLoaderData | Response> {
  const user = await loadCurrentUser();

  if (!user) {
    return redirect("/login");
  }

  if (!user.admin) {
    return redirect("/");
  }

  return { user };
}

clientLoader.hydrate = true as const;

export default function AdminLayout(): JSX.Element {
  return (
    <>
      <Container className="pt-3">
        <Nav pills>
          <NavItem>
            <NavLink tag={Link} to="/admin">
              Admin
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={Link} to="/admin/users">
              Users
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={Link} to="/admin/sessions">
              Sessions
            </NavLink>
          </NavItem>
        </Nav>
      </Container>
      <Outlet />
    </>
  );
}
