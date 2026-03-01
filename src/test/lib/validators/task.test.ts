import { describe, it, expect } from "vitest";
import { taskQuerySchema, statusEnum, priorityEnum } from "@/lib/validators/task";

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
