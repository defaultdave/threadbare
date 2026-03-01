import { describe, it, expect } from "vitest";
import { serializeTask } from "../task";

describe("serializeTask", () => {
  const basePrismaTask = {
    id: "task-1",
    title: "Test task",
    description: "A description",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: new Date("2026-03-20T10:00:00Z"),
    categoryId: "cat-1",
    createdAt: new Date("2026-03-01T08:00:00Z"),
    updatedAt: new Date("2026-03-10T12:00:00Z"),
    category: {
      id: "cat-1",
      name: "Inventory",
      color: "#ff0000",
      icon: "box",
    },
  };

  it("serializes dates to ISO strings", () => {
    const result = serializeTask(basePrismaTask);
    expect(result.dueDate).toBe("2026-03-20T10:00:00.000Z");
    expect(result.createdAt).toBe("2026-03-01T08:00:00.000Z");
    expect(result.updatedAt).toBe("2026-03-10T12:00:00.000Z");
  });

  it("serializes null dueDate as null", () => {
    const task = { ...basePrismaTask, dueDate: null };
    const result = serializeTask(task);
    expect(result.dueDate).toBeNull();
  });

  it("preserves scalar fields", () => {
    const result = serializeTask(basePrismaTask);
    expect(result.id).toBe("task-1");
    expect(result.title).toBe("Test task");
    expect(result.description).toBe("A description");
    expect(result.status).toBe("todo");
    expect(result.priority).toBe("medium");
    expect(result.categoryId).toBe("cat-1");
  });

  it("preserves the category relation", () => {
    const result = serializeTask(basePrismaTask);
    expect(result.category).toEqual({
      id: "cat-1",
      name: "Inventory",
      color: "#ff0000",
      icon: "box",
    });
  });
});
