import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskCard, formatDueDate, getDueDateStyle, statusLabels, priorityConfig } from "@/components/shared/task-card";
import type { TaskWithCategory } from "@/lib/types/task";

function makeTask(overrides: Partial<TaskWithCategory> = {}): TaskWithCategory {
  return {
    id: "task-1",
    title: "Restock winter coats",
    description: "Check inventory levels",
    status: "todo",
    priority: "medium",
    dueDate: null,
    categoryId: "cat-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    category: {
      id: "cat-1",
      name: "Inventory",
      color: "#3b82f6",
      icon: "📦",
    },
    ...overrides,
  };
}

describe("TaskCard", () => {
  it("should render the task title", () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText("Restock winter coats")).toBeInTheDocument();
  });

  it("should render the status badge", () => {
    render(<TaskCard task={makeTask({ status: "todo" })} />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("should render in_progress status label", () => {
    render(<TaskCard task={makeTask({ status: "in_progress" })} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("should render done status label", () => {
    render(<TaskCard task={makeTask({ status: "done" })} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should render the category badge with name and icon", () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("should render the priority indicator", () => {
    render(<TaskCard task={makeTask({ priority: "urgent" })} />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority: Urgent")).toBeInTheDocument();
  });

  it("should render all priority levels", () => {
    const priorities = ["low", "medium", "high", "urgent"] as const;
    for (const priority of priorities) {
      const { unmount } = render(<TaskCard task={makeTask({ priority })} />);
      expect(screen.getByText(priorityConfig[priority].label)).toBeInTheDocument();
      unmount();
    }
  });

  it("should render due date when present", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    render(<TaskCard task={makeTask({ dueDate: futureDate.toISOString() })} />);
    const dueDateLabel = screen.getByLabelText(/Due date:/);
    expect(dueDateLabel).toBeInTheDocument();
  });

  it("should not render due date when null", () => {
    render(<TaskCard task={makeTask({ dueDate: null })} />);
    expect(screen.queryByLabelText(/Due date:/)).not.toBeInTheDocument();
  });

  it("should have proper article element with aria label", () => {
    render(<TaskCard task={makeTask()} />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("aria-label", "Task: Restock winter coats");
  });

  it("should apply category color to the category badge border", () => {
    render(<TaskCard task={makeTask()} />);
    const categoryBadge = screen.getByText("Inventory").closest("[style]");
    expect(categoryBadge).toHaveStyle({ borderColor: "#3b82f6" });
  });
});

describe("formatDueDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'Overdue' for past dates", () => {
    expect(formatDueDate("2026-03-10T00:00:00.000Z")).toBe("Overdue");
  });

  it("should return 'Due today' when due date is earlier same day", () => {
    // Now is 12:00 UTC, due at 06:00 UTC same day => diffMs < 0, ceil => 0 => "Due today"
    expect(formatDueDate("2026-03-15T06:00:00.000Z")).toBe("Due today");
  });

  it("should return 'Due tomorrow' for date within next day", () => {
    // Now is 12:00 UTC, due at 23:59 same calendar day => diffMs ~0.5 day, ceil => 1 => "Due tomorrow"
    expect(formatDueDate("2026-03-15T23:59:59.000Z")).toBe("Due tomorrow");
  });

  it("should return formatted date for future dates", () => {
    const result = formatDueDate("2026-04-20T00:00:00.000Z");
    expect(result).toMatch(/Apr\s+20/);
  });
});

describe("getDueDateStyle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return red style for overdue dates", () => {
    const style = getDueDateStyle("2026-03-10T00:00:00.000Z");
    expect(style).toContain("text-red-600");
  });

  it("should return orange style for dates due today", () => {
    // diffDays = 0 => due today
    const style = getDueDateStyle("2026-03-15T06:00:00.000Z");
    expect(style).toContain("text-orange-600");
  });

  it("should return orange style for dates due tomorrow", () => {
    // diffDays = 1 => due tomorrow
    const style = getDueDateStyle("2026-03-15T23:59:59.000Z");
    expect(style).toContain("text-orange-600");
  });

  it("should return muted style for future dates", () => {
    const style = getDueDateStyle("2026-04-20T00:00:00.000Z");
    expect(style).toContain("text-muted-foreground");
  });
});

describe("statusLabels", () => {
  it("should have labels for all statuses", () => {
    expect(statusLabels.todo).toBe("To Do");
    expect(statusLabels.in_progress).toBe("In Progress");
    expect(statusLabels.done).toBe("Done");
  });
});
