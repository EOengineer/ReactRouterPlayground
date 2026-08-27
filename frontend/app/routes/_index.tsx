import type { JSX } from "react";
import { redirect, useLoaderData } from "react-router";
import { Alert, Container } from "reactstrap";

import { fetchCurrentUser } from "~/lib/api";
import { AuthApiError } from "~/types/auth";
import type { User } from "~/types/user";

export function meta(): Array<{ title?: string; name?: string; content?: string }> {
  return [
    { title: "Home | ReactRouterPlayground" },
    { name: "description", content: "Hello from React Router Playground" },
  ];
}

export async function clientLoader(): Promise<User | Response> {
  try {
    return await fetchCurrentUser();
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      return redirect("/login");
    }
    throw error;
  }
}

clientLoader.hydrate = true as const;

export default function Home(): JSX.Element {
  useLoaderData<typeof clientLoader>();

  return (
    <Container className="py-5">
      <Alert color="primary" className="mb-0">
        Hello
      </Alert>
    </Container>
  );
}
