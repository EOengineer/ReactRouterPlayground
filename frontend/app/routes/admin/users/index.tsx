import type { JSX, KeyboardEvent } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { Badge, Container, Table } from "reactstrap";

import { fetchUsers } from "~/lib/admin/users.api";
import type { User } from "~/types/user";

export async function clientLoader(): Promise<{ users: User[] }> {
  return { users: await fetchUsers() };
}

clientLoader.hydrate = true as const;

function fullName(user: User): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export default function AdminUsers(): JSX.Element {
  const { users } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();

  function goToUser(userId: number): void {
    void navigate(`/admin/users/${String(userId)}`);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, userId: number): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToUser(userId);
    }
  }

  return (
    <Container className="py-4">
      <h1 className="mb-3">Users</h1>
      <Table responsive hover bordered className="align-middle mb-0">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted py-4">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                role="link"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  goToUser(user.id);
                }}
                onKeyDown={(event) => {
                  handleRowKeyDown(event, user.id);
                }}
              >
                <td>{user.id}</td>
                <td>{fullName(user)}</td>
                <td>{user.email}</td>
                <td>
                  {user.admin ? (
                    <Badge color="primary">Yes</Badge>
                  ) : (
                    <Badge color="secondary">No</Badge>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
}
