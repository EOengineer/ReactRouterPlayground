import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminSessions from "./index";

describe("AdminSessions", () => {
  it("renders the Sessions heading", () => {
    render(<AdminSessions />);
    expect(screen.getByRole("heading", { name: "Sessions" })).toBeInTheDocument();
  });
});
