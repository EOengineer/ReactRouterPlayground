import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Admin from "./admin";

describe("Admin", () => {
  it("renders the Admin heading", () => {
    render(<Admin />);
    expect(screen.getByRole("heading", { name: "Admin" })).toBeInTheDocument();
  });
});
