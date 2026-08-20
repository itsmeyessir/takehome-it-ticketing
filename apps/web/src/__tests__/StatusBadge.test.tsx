import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../components/StatusBadge";

describe("StatusBadge", () => {
  it("renders Open status with blue badge", () => {
    render(<StatusBadge status="OPEN" />);
    const badge = screen.getByText("Open");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-blue-100");
  });

  it("renders In Progress status with amber badge", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    const badge = screen.getByText("In Progress");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-amber-100");
  });

  it("renders Escalated status with red badge", () => {
    render(<StatusBadge status="ESCALATED" />);
    const badge = screen.getByText("Escalated");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-red-100");
  });

  it("renders Resolved status with green badge", () => {
    render(<StatusBadge status="RESOLVED" />);
    const badge = screen.getByText("Resolved");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-emerald-100");
  });

  it("renders Closed status with gray badge", () => {
    render(<StatusBadge status="CLOSED" />);
    const badge = screen.getByText("Closed");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-slate-100");
  });
});
