import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./_index";

describe("Home", () => {
  it("renders Hello", () => {
    render(<Home />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
