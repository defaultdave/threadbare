import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/shared/empty-state";

describe("EmptyState", () => {
  it("should render 'No tasks found' heading", () => {
    render(<EmptyState hasFilters={false} />);
    expect(screen.getByText("No tasks found")).toBeInTheDocument();
  });

  it("should show creation message when no filters are active", () => {
    render(<EmptyState hasFilters={false} />);
    expect(
      screen.getByText(/tasks will appear here once they are created/i)
    ).toBeInTheDocument();
  });

  it("should show filter adjustment message when filters are active", () => {
    render(<EmptyState hasFilters={true} />);
    expect(
      screen.getByText(/try adjusting your filters/i)
    ).toBeInTheDocument();
  });

  it("should have status role for accessibility", () => {
    render(<EmptyState hasFilters={false} />);
    const container = screen.getByRole("status");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-label", "No tasks found");
  });
});
