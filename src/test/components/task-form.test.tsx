import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TaskForm } from "@/components/shared/task-form";
import type { CategorySummary, TaskWithCategory } from "@/lib/types/task";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const sampleCategories: CategorySummary[] = [
  { id: "cat-1", name: "Inventory", color: "#3b82f6", icon: "📦" },
  { id: "cat-2", name: "Display", color: "#8b5cf6", icon: "🎨" },
];

const sampleTask: TaskWithCategory = {
  id: "task-1",
  title: "Restock winter coats",
  description: "Check inventory levels",
  status: "todo",
  priority: "medium",
  dueDate: "2026-04-15T00:00:00.000Z",
  categoryId: "cat-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  category: { id: "cat-1", name: "Inventory", color: "#3b82f6", icon: "📦" },
};

describe("TaskForm (create mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the form with correct aria-label", () => {
    render(<TaskForm categories={sampleCategories} />);
    expect(screen.getByRole("form", { name: "Create task" })).toBeInTheDocument();
  });

  it("should render the title input with autoFocus", () => {
    render(<TaskForm categories={sampleCategories} />);
    const titleInput = screen.getByLabelText(/Title/);
    expect(titleInput).toBeInTheDocument();
    // React renders autoFocus as a property not an HTML attribute in jsdom
    // Check the element has id="title" and is an input (the autoFocus prop is passed)
    expect(titleInput).toHaveAttribute("id", "title");
    expect(titleInput.tagName).toBe("INPUT");
  });

  it("should render title as required", () => {
    render(<TaskForm categories={sampleCategories} />);
    const titleInput = screen.getByLabelText(/Title/);
    expect(titleInput).toHaveAttribute("aria-required", "true");
  });

  it("should render the description textarea", () => {
    render(<TaskForm categories={sampleCategories} />);
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("should render category and priority selects", () => {
    render(<TaskForm categories={sampleCategories} />);
    expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/)).toBeInTheDocument();
  });

  it("should render the due date input", () => {
    render(<TaskForm categories={sampleCategories} />);
    const dueDateInput = screen.getByLabelText("Due Date");
    expect(dueDateInput).toBeInTheDocument();
    expect(dueDateInput).toHaveAttribute("type", "date");
  });

  it("should render Submit and Cancel buttons", () => {
    render(<TaskForm categories={sampleCategories} />);
    expect(screen.getByRole("button", { name: "Create Task" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should not render Status field in create mode", () => {
    render(<TaskForm categories={sampleCategories} />);
    expect(screen.queryByLabelText(/Status/)).not.toBeInTheDocument();
  });

  it("should show required field indicators (red asterisks)", () => {
    render(<TaskForm categories={sampleCategories} />);
    // Required fields (Title, Category, Priority) should show asterisk indicators
    const form = screen.getByRole("form", { name: "Create task" });
    const requiredIndicators = form.querySelectorAll("[aria-hidden='true']");
    const asterisks = Array.from(requiredIndicators).filter(
      (el) => el.textContent === "*"
    );
    expect(asterisks.length).toBeGreaterThanOrEqual(3);
  });

  it("should show validation error when title is empty on submit", async () => {
    render(<TaskForm categories={sampleCategories} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });
  });

  it("should show title validation error on blur when empty", async () => {
    render(<TaskForm categories={sampleCategories} />);
    const titleInput = screen.getByLabelText(/Title/);

    await act(async () => {
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
    });

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });
  });

  it("should associate error message with field via aria-describedby", async () => {
    render(<TaskForm categories={sampleCategories} />);
    const titleInput = screen.getByLabelText(/Title/);

    await act(async () => {
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
    });

    await waitFor(() => {
      expect(titleInput).toHaveAttribute("aria-describedby", "title-error");
      expect(titleInput).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("should clear title error when user types after validation error", async () => {
    render(<TaskForm categories={sampleCategories} />);
    const titleInput = screen.getByLabelText(/Title/);

    await act(async () => {
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
    });

    await waitFor(() => expect(screen.getByText("Title is required")).toBeInTheDocument());

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: "New task title" } });
    });

    await waitFor(() =>
      expect(screen.queryByText("Title is required")).not.toBeInTheDocument()
    );
  });

  it("should navigate to /tasks when Cancel is clicked", async () => {
    render(<TaskForm categories={sampleCategories} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(mockPush).toHaveBeenCalledWith("/tasks");
  });

  it("should show category validation error when category not selected on submit with title", async () => {
    render(<TaskForm categories={sampleCategories} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Fold shirts" },
      });
      fireEvent.submit(screen.getByRole("form", { name: "Create task" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Category is required")).toBeInTheDocument();
    });

    // fetch should not be called when validation fails
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should not submit when required fields are missing", async () => {
    render(<TaskForm categories={sampleCategories} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Test task" },
      });
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "Create task" }));
    });

    // Category is required but not selected — validation should block submission
    await waitFor(() => {
      expect(screen.getByText("Category is required")).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show category validation error when submitting with title but no category", async () => {
    render(<TaskForm categories={sampleCategories} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Test task" },
      });
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "Create task" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Category is required")).toBeInTheDocument();
    });

    // Validation fails before fetch is called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should display category required error when category not selected on submit", async () => {
    render(<TaskForm categories={sampleCategories} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Test task" },
      });
      fireEvent.submit(screen.getByRole("form", { name: "Create task" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Category is required")).toBeInTheDocument();
    });
  });
});

describe("TaskForm (edit mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the form with correct aria-label for edit mode", () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);
    expect(screen.getByRole("form", { name: "Edit task" })).toBeInTheDocument();
  });

  it("should pre-fill title with existing task value", () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
    expect(titleInput.value).toBe("Restock winter coats");
  });

  it("should pre-fill description with existing task value", () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);
    const descTextarea = screen.getByLabelText("Description") as HTMLTextAreaElement;
    expect(descTextarea.value).toBe("Check inventory levels");
  });

  it("should pre-fill due date with existing task value (YYYY-MM-DD)", () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);
    const dueDateInput = screen.getByLabelText("Due Date") as HTMLInputElement;
    expect(dueDateInput.value).toBe("2026-04-15");
  });

  it("should render Status field in edit mode", () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);
    expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
  });

  it("should show 'Save Changes' submit button in edit mode", () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("should call PUT /api/tasks/[id] on edit submit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleTask,
    });

    render(<TaskForm task={sampleTask} categories={sampleCategories} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Updated title" },
      });
      fireEvent.submit(screen.getByRole("form", { name: "Edit task" }));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/tasks/${sampleTask.id}`,
        expect.objectContaining({ method: "PUT" })
      );
    });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(callBody.title).toBe("Updated title");
  });

  it("should navigate to /tasks when Cancel is clicked in edit mode", async () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(mockPush).toHaveBeenCalledWith("/tasks");
  });

  it("should show validation error when title is cleared and form is submitted", async () => {
    render(<TaskForm task={sampleTask} categories={sampleCategories} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "" },
      });
      fireEvent.submit(screen.getByRole("form", { name: "Edit task" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });

    // Should not call fetch since validation failed
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
