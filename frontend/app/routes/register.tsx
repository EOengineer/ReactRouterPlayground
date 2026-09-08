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

import { useCurrentUser } from "~/contexts/current-user";
import { AuthApiError } from "~/types/auth";
import type { RegistrationPayload } from "~/types/auth";

export function meta(): Array<{ title?: string; name?: string; content?: string }> {
  return [
    { title: "Register | ReactRouterPlayground" },
    { name: "description", content: "Create an account for React Router Playground" },
  ];
}

export default function Register(): JSX.Element {
  const navigate = useNavigate();
  const { register } = useCurrentUser();
  const [payload, setPayload] = useState<RegistrationPayload>({
    email: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await register(payload);
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
      <h1 className="h3 mb-4">Create account</h1>

      {error ? (
        <Alert color="danger" data-testid="register-error">
          {error}
        </Alert>
      ) : null}

      <Form onSubmit={(event) => void handleSubmit(event)}>
        <FormGroup>
          <Label for="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            required
            value={payload.first_name}
            onChange={(event) => {
              setPayload((current) => ({ ...current, first_name: event.target.value }));
            }}
          />
        </FormGroup>

        <FormGroup>
          <Label for="last_name">Last name</Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            required
            value={payload.last_name}
            onChange={(event) => {
              setPayload((current) => ({ ...current, last_name: event.target.value }));
            }}
          />
        </FormGroup>

        <FormGroup>
          <Label for="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={payload.email}
            onChange={(event) => {
              setPayload((current) => ({ ...current, email: event.target.value }));
            }}
          />
        </FormGroup>

        <FormGroup>
          <Label for="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={payload.password}
            onChange={(event) => {
              setPayload((current) => ({ ...current, password: event.target.value }));
            }}
          />
        </FormGroup>

        <FormGroup>
          <Label for="password_confirmation">Confirm password</Label>
          <Input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={payload.password_confirmation}
            onChange={(event) => {
              setPayload((current) => ({
                ...current,
                password_confirmation: event.target.value,
              }));
            }}
          />
        </FormGroup>

        <Button color="primary" type="submit" disabled={pending} className="w-100">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </Form>

      <p className="mt-3 mb-0 text-center">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Container>
  );
}
