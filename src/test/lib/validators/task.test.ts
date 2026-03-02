import { describe, it, expect } from "vitest";
import {
  taskQuerySchema,
  statusEnum,
  priorityEnum,
  createTaskSchema,
  updateTaskSchema,
} from "@/lib/validators/task";

describe("taskQuerySchema", () => {
  it("should accept empty object (no filters)", () => {
    const result = taskQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
      expect(result.data.categoryId).toBeUndefined();
    }
  });

  it("should accept valid status filter", () => {
    const result = taskQuerySchema.safeParse({ status: "todo" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("todo");
    }
  });

  it("should accept all valid status values", () => {
    for (const status of ["todo", "in_progress", "done"]) {
      const result = taskQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status value", () => {
    const result = taskQuerySchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid categoryId filter", () => {
    const result = taskQuerySchema.safeParse({ categoryId: "cuid123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBe("cuid123");
    }
  });

  it("should accept both status and categoryId together", () => {
    const result = taskQuerySchema.safeParse({
      status: "in_progress",
      categoryId: "cat-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("in_progress");
      expect(result.data.categoryId).toBe("cat-1");
    }
  });

  it("should reject numeric status", () => {
    const result = taskQuerySchema.safeParse({ status: 123 });
    expect(result.success).toBe(false);
  });
});

describe("statusEnum", () => {
  it("should accept valid status values", () => {
    expect(statusEnum.safeParse("todo").success).toBe(true);
    expect(statusEnum.safeParse("in_progress").success).toBe(true);
    expect(statusEnum.safeParse("done").success).toBe(true);
  });

  it("should reject invalid status values", () => {
    expect(statusEnum.safeParse("pending").success).toBe(false);
    expect(statusEnum.safeParse("").success).toBe(false);
  });
});

describe("priorityEnum", () => {
  it("should accept valid priority values", () => {
    expect(priorityEnum.safeParse("low").success).toBe(true);
    expect(priorityEnum.safeParse("medium").success).toBe(true);
    expect(priorityEnum.safeParse("high").success).toBe(true);
    expect(priorityEnum.safeParse("urgent").success).toBe(true);
  });

  it("should reject invalid priority values", () => {
    expect(priorityEnum.safeParse("critical").success).toBe(false);
    expect(priorityEnum.safeParse("").success).toBe(false);
  });
});

describe("createTaskSchema", () => {
  const validInput = {
    title: "Restock winter coats",
    categoryId: "cat-1",
    priority: "high",
  };

  it("should accept minimal valid input and default status to todo", () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("todo");
      expect(result.data.description).toBeUndefined();
      expect(result.data.dueDate).toBeUndefined();
    }
  });

  it("should accept full valid input", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: "Urgent restock needed",
      dueDate: "2026-04-01T00:00:00.000Z",
      status: "in_progress",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Restock winter coats");
      expect(result.data.description).toBe("Urgent restock needed");
      expect(result.data.dueDate).toBe("2026-04-01T00:00:00.000Z");
      expect(result.data.status).toBe("in_progress");
    }
  });

  it("should reject missing title", () => {
    const result = createTaskSchema.safeParse({
      categoryId: "cat-1",
      priority: "high",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = createTaskSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title is required");
    }
  });

  it("should reject missing categoryId", () => {
    const result = createTaskSchema.safeParse({ title: "Task", priority: "low" });
    expect(result.success).toBe(false);
  });

  it("should reject empty categoryId", () => {
    const result = createTaskSchema.safeParse({ ...validInput, categoryId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Category is required");
    }
  });

  it("should reject missing priority", () => {
    const result = createTaskSchema.safeParse({
      title: "Task",
      categoryId: "cat-1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid priority", () => {
    const result = createTaskSchema.safeParse({ ...validInput, priority: "critical" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid dueDate format", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      dueDate: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid date format");
    }
  });

  it("should reject invalid status", () => {
    const result = createTaskSchema.safeParse({ ...validInput, status: "pending" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid priority values", () => {
    for (const priority of ["low", "medium", "high", "urgent"]) {
      const result = createTaskSchema.safeParse({ ...validInput, priority });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid status values", () => {
    for (const status of ["todo", "in_progress", "done"]) {
      const result = createTaskSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateTaskSchema", () => {
  const validInput = {
    title: "Updated task",
    categoryId: "cat-2",
    priority: "medium",
    status: "in_progress",
  };

  it("should accept valid update input", () => {
    const result = updateTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated task");
      expect(result.data.status).toBe("in_progress");
    }
  });

  it("should accept update with all fields including dueDate", () => {
    const result = updateTaskSchema.safeParse({
      ...validInput,
      description: "New description",
      dueDate: "2026-06-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null dueDate to clear the field", () => {
    const result = updateTaskSchema.safeParse({ ...validInput, dueDate: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeNull();
    }
  });

  it("should reject missing status", () => {
    const noStatus = {
      title: validInput.title,
      categoryId: validInput.categoryId,
      priority: validInput.priority,
    };
    const result = updateTaskSchema.safeParse(noStatus);
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = updateTaskSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title is required");
    }
  });

  it("should reject invalid priority", () => {
    const result = updateTaskSchema.safeParse({ ...validInput, priority: "extreme" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = updateTaskSchema.safeParse({ ...validInput, status: "archived" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid dueDate format", () => {
    const result = updateTaskSchema.safeParse({
      ...validInput,
      dueDate: "2026/06/01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid date format");
    }
  });
});
