import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskFilters } from "@/components/shared/task-filters";
import type { CategorySummary } from "@/lib/types/task";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

const sampleCategories: CategorySummary[] = [
  { id: "cat-1", name: "Inventory", color: "#3b82f6", icon: "📦" },
  { id: "cat-2", name: "Display", color: "#8b5cf6", icon: "🎨" },
  { id: "cat-3", name: "Operations", color: "#10b981", icon: "⚙️" },
];

describe("TaskFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render status filter label", () => {
    render(<TaskFilters categories={sampleCategories} />);
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("should render category filter label", () => {
    render(<TaskFilters categories={sampleCategories} />);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("should render status filter trigger with id", () => {
    render(<TaskFilters categories={sampleCategories} />);
    const statusTrigger = document.getElementById("status-filter");
    expect(statusTrigger).toBeInTheDocument();
  });

  it("should render category filter trigger with id", () => {
    render(<TaskFilters categories={sampleCategories} />);
    const categoryTrigger = document.getElementById("category-filter");
    expect(categoryTrigger).toBeInTheDocument();
  });

  it("should have filter group with aria-label", () => {
    render(<TaskFilters categories={sampleCategories} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-label", "Task filters");
  });

  it("should render with associated labels for accessibility", () => {
    render(<TaskFilters categories={sampleCategories} />);
    const statusLabel = screen.getByText("Status");
    expect(statusLabel).toHaveAttribute("for", "status-filter");
    const categoryLabel = screen.getByText("Category");
    expect(categoryLabel).toHaveAttribute("for", "category-filter");
  });

  it("should render with empty categories list", () => {
    render(<TaskFilters categories={[]} />);
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });
});
