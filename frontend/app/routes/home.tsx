import type { JSX } from "react";
import { Alert, Container } from "reactstrap";

export function meta(): Array<{ title?: string; name?: string; content?: string }> {
  return [
    { title: "Home | ReactRouterPlayground" },
    { name: "description", content: "Hello from React Router Playground" },
  ];
}

export default function Home(): JSX.Element {
  return (
    <Container className="py-5">
      <Alert color="primary" className="mb-0">
        Hello
      </Alert>
    </Container>
  );
}
