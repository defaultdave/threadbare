import { describe, it, expect } from "vitest";
import { taskQuerySchema, statusEnum } from "../task";

describe("taskQuerySchema", () => {
  it("parses valid status and categoryId", () => {
    const result = taskQuerySchema.safeParse({
      status: "todo",
      categoryId: "abc-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("todo");
      expect(result.data.categoryId).toBe("abc-123");
    }
  });

  it("allows omitted fields", () => {
    const result = taskQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
      expect(result.data.categoryId).toBeUndefined();
    }
  });

  it("converts empty categoryId to undefined", () => {
    const result = taskQuerySchema.safeParse({ categoryId: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBeUndefined();
    }
  });

  it("converts empty status to undefined", () => {
    const result = taskQuerySchema.safeParse({ status: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
    }
  });

  it("rejects invalid status values", () => {
    const result = taskQuerySchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid status values", () => {
    for (const status of ["todo", "in_progress", "done"]) {
      const result = taskQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });
});

describe("statusEnum", () => {
  it("accepts valid values", () => {
    expect(statusEnum.safeParse("todo").success).toBe(true);
    expect(statusEnum.safeParse("in_progress").success).toBe(true);
    expect(statusEnum.safeParse("done").success).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(statusEnum.safeParse("invalid").success).toBe(false);
    expect(statusEnum.safeParse("").success).toBe(false);
  });
});
