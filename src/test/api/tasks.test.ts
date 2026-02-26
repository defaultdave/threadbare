import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { TasksApiResponse } from "@/lib/types/task";

const mockFindManyTasks = vi.fn();
const mockFindManyCategories = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    task: { findMany: (...args: unknown[]) => mockFindManyTasks(...args) },
    category: { findMany: (...args: unknown[]) => mockFindManyCategories(...args) },
  },
}));

const sampleCategories = [
  { id: "cat-1", name: "Inventory", color: "#3b82f6", icon: "📦" },
  { id: "cat-2", name: "Display", color: "#8b5cf6", icon: "🎨" },
];

const sampleTasks = [
  {
    id: "task-1",
    title: "Restock winter coats",
    description: null,
    status: "todo",
    priority: "high",
    dueDate: new Date("2026-04-01T00:00:00.000Z"),
    categoryId: "cat-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    category: sampleCategories[0],
  },
  {
    id: "task-2",
    title: "Update display window",
    description: "Spring theme",
    status: "in_progress",
    priority: "medium",
    dueDate: null,
    categoryId: "cat-2",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    category: sampleCategories[1],
  },
];

describe("GET /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindManyTasks.mockResolvedValue(sampleTasks);
    mockFindManyCategories.mockResolvedValue(sampleCategories);
  });

  async function callRoute(url: string) {
    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest(new URL(url, "http://localhost:3000"));
    return GET(request);
  }

  it("should return tasks and categories for unfiltered request", async () => {
    const response = await callRoute("/api/tasks");

    expect(response.status).toBe(200);
    const data: TasksApiResponse = await response.json();
    expect(data.tasks).toHaveLength(2);
    expect(data.categories).toHaveLength(2);
  });

  it("should serialize task dates to ISO strings", async () => {
    const response = await callRoute("/api/tasks");
    const data: TasksApiResponse = await response.json();

    expect(data.tasks[0].dueDate).toBe("2026-04-01T00:00:00.000Z");
    expect(data.tasks[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(data.tasks[1].dueDate).toBeNull();
  });

  it("should pass status filter to prisma query", async () => {
    await callRoute("/api/tasks?status=todo");

    expect(mockFindManyTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "todo" }),
      })
    );
  });

  it("should pass categoryId filter to prisma query", async () => {
    await callRoute("/api/tasks?categoryId=cat-1");

    expect(mockFindManyTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: "cat-1" }),
      })
    );
  });

  it("should pass both filters to prisma query", async () => {
    await callRoute("/api/tasks?status=done&categoryId=cat-2");

    expect(mockFindManyTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "done",
          categoryId: "cat-2",
        }),
      })
    );
  });

  it("should return 400 for invalid status parameter", async () => {
    const response = await callRoute("/api/tasks?status=invalid");

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should include category data with tasks", async () => {
    const response = await callRoute("/api/tasks");
    const data: TasksApiResponse = await response.json();

    expect(data.tasks[0].category).toEqual({
      id: "cat-1",
      name: "Inventory",
      color: "#3b82f6",
      icon: "📦",
    });
  });

  it("should order tasks by dueDate asc, priority desc, createdAt desc", async () => {
    await callRoute("/api/tasks");

    expect(mockFindManyTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { dueDate: "asc" },
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      })
    );
  });

  it("should order categories by name ascending", async () => {
    await callRoute("/api/tasks");

    expect(mockFindManyCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });

  it("should return empty arrays when no tasks exist", async () => {
    mockFindManyTasks.mockResolvedValue([]);
    mockFindManyCategories.mockResolvedValue([]);

    const response = await callRoute("/api/tasks");
    const data: TasksApiResponse = await response.json();

    expect(data.tasks).toEqual([]);
    expect(data.categories).toEqual([]);
  });

  it("should send empty where clause when no filters provided", async () => {
    await callRoute("/api/tasks");

    expect(mockFindManyTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });
});
