import { useState, type JSX, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Button,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
} from "reactstrap";

import { login } from "~/lib/api";
import { AuthApiError } from "~/types/auth";
import type { LoginCredentials } from "~/types/auth";

export function meta(): Array<{ title?: string; name?: string; content?: string }> {
  return [
    { title: "Login | ReactRouterPlayground" },
    { name: "description", content: "Sign in to React Router Playground" },
  ];
}

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await login(credentials);
      await navigate("/");
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="py-5" style={{ maxWidth: "28rem" }}>
      <h1 className="h3 mb-4">Sign in</h1>

      {error ? (
        <Alert color="danger" data-testid="login-error">
          {error}
        </Alert>
      ) : null}

      <Form onSubmit={(event) => void handleSubmit(event)}>
        <FormGroup>
          <Label for="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={credentials.email}
            onChange={(event) => {
              setCredentials((current) => ({ ...current, email: event.target.value }));
            }}
          />
        </FormGroup>

        <FormGroup>
          <Label for="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={credentials.password}
            onChange={(event) => {
              setCredentials((current) => ({
                ...current,
                password: event.target.value,
              }));
            }}
          />
        </FormGroup>

        <Button color="primary" type="submit" disabled={pending} className="w-100">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </Form>

      <p className="mt-3 mb-0 text-center">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </Container>
  );
}
