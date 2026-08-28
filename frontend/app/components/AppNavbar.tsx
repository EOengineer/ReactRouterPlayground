import { useState, type JSX } from "react";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Collapse,
  Nav,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  NavItem,
  NavLink,
} from "reactstrap";

import { logout } from "~/lib/api";
import type { User } from "~/types/user";

export type AppNavbarProps = {
  user: User | null;
};

export default function AppNavbar({ user }: AppNavbarProps): JSX.Element {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleLogout(): Promise<void> {
    setPending(true);
    try {
      await logout();
      await navigate("/login");
    } finally {
      setPending(false);
      setIsOpen(false);
    }
  }

  return (
    <Navbar color="light" light expand="md" container className="border-bottom">
      <NavbarBrand tag={Link} to="/">
        ReactRouterPlayground
      </NavbarBrand>
      <NavbarToggler
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        aria-label="Toggle navigation"
      />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="ms-auto" navbar>
          {user ? (
            <NavItem>
              <Button
                color="link"
                className="nav-link"
                type="button"
                disabled={pending}
                onClick={() => {
                  void handleLogout();
                }}
              >
                {pending ? "Logging out…" : "Log out"}
              </Button>
            </NavItem>
          ) : (
            <>
              <NavItem>
                <NavLink tag={Link} to="/login">
                  Login
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/register">
                  Register
                </NavLink>
              </NavItem>
            </>
          )}
        </Nav>
      </Collapse>
    </Navbar>
  );
}
