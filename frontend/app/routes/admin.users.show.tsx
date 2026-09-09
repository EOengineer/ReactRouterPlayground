import type { JSX } from "react";
import { useParams } from "react-router";
import { Container } from "reactstrap";

export default function AdminUserShow(): JSX.Element {
  const { id } = useParams();

  return (
    <Container className="py-4">
      <h1>User {id}</h1>
    </Container>
  );
}
