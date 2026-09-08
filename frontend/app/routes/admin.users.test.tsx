import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminUsers from "./admin.users";

describe("AdminUsers", () => {
  it("renders the Users heading", () => {
    render(<AdminUsers />);
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });
});
