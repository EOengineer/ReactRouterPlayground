import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./home";

describe("Home", () => {
  it("renders Hello", () => {
    render(<Home />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
