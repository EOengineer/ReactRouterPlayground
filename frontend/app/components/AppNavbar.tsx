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

import { useCurrentUser } from "~/contexts/current-user";

export default function AppNavbar(): JSX.Element {
  const navigate = useNavigate();
  const { user, status, logout, isAdmin } = useCurrentUser();
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


  function renderAuthLinks(): JSX.Element | null {
    if (status === "loading") {
      return null;
    }

    if (user) {
      return (
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
      );
    }

    return (
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
    );
  }

  function renderAdminLinks(): JSX.Element | null {
    if (isAdmin) {
      return <NavItem><NavLink tag={Link} to="/admin">Admin</NavLink></NavItem>;
    } 
    return null;
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
          {renderAuthLinks()}
          {renderAdminLinks()}
        </Nav>
      </Collapse>
    </Navbar>
  );
}
