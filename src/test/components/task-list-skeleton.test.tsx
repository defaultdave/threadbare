import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskListSkeleton } from "@/components/shared/task-list-skeleton";

describe("TaskListSkeleton", () => {
  it("should render with loading status role", () => {
    render(<TaskListSkeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
  });

  it("should have aria-label for loading state", () => {
    render(<TaskListSkeleton />);
    const skeleton = screen.getByLabelText("Loading tasks");
    expect(skeleton).toBeInTheDocument();
  });

  it("should have aria-busy attribute", () => {
    render(<TaskListSkeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });

  it("should render multiple skeleton cards", () => {
    const { container } = render(<TaskListSkeleton />);
    const cards = container.querySelectorAll(".rounded-xl");
    expect(cards.length).toBe(5);
  });
});
