import type { JSX } from "react";
import { useLoaderData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";
import { Container } from "reactstrap";
import { fetchUser } from "~/lib/admin/users.api";
import type { User } from "~/types/user";
import { Badge } from "reactstrap";

export async function clientLoader({ params }: ClientLoaderFunctionArgs): Promise<{ user: User }> {
  const id = params.id;
  if (!id) {
    // React Router treats thrown Response as a route error
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- route 404
    throw new Response("Not Found", { status: 404 });
  }

  return { user: await fetchUser(id) };
}

clientLoader.hydrate = true as const;

export default function AdminUserShow(): JSX.Element {
  const { user } = useLoaderData<typeof clientLoader>();

  return (
    <Container className="py-4">
      <h1 className="mb-3">
        {user.first_name} {user.last_name}
      </h1>
      <dl className="mb-0">
        <dt>ID</dt>
        <dd>{user.id}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Admin</dt>
        <dd>
          {user.admin ? (
            <Badge color="primary">Yes</Badge>
          ) : (
            <Badge color="secondary">No</Badge>
          )}
        </dd>
      </dl>
    </Container>
  );

}
