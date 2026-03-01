import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { TasksApiResponse, TaskApiResponse } from "@/lib/types/task";

const mockFindManyTasks = vi.fn();
const mockFindManyCategories = vi.fn();
const mockCreateTask = vi.fn();
const mockFindUniqueTask = vi.fn();
const mockUpdateTask = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    task: {
      findMany: (...args: unknown[]) => mockFindManyTasks(...args),
      create: (...args: unknown[]) => mockCreateTask(...args),
      findUnique: (...args: unknown[]) => mockFindUniqueTask(...args),
      update: (...args: unknown[]) => mockUpdateTask(...args),
    },
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

describe("POST /api/tasks", () => {
  const createdTask = {
    ...sampleTasks[0],
    id: "task-new",
    title: "New task",
    description: "A description",
    status: "todo",
    priority: "low",
    dueDate: null,
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTask.mockResolvedValue(createdTask);
  });

  async function callRoute(body: unknown) {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest(
      new URL("/api/tasks", "http://localhost:3000"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return POST(request);
  }

  it("should create a task and return 201 with task data", async () => {
    const response = await callRoute({
      title: "New task",
      description: "A description",
      categoryId: "cat-1",
      priority: "low",
    });

    expect(response.status).toBe(201);
    const data: TaskApiResponse = await response.json();
    expect(data.task.id).toBe("task-new");
    expect(data.task.title).toBe("New task");
  });

  it("should call prisma.task.create with correct fields", async () => {
    await callRoute({
      title: "New task",
      categoryId: "cat-1",
      priority: "medium",
    });

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "New task",
          categoryId: "cat-1",
          priority: "medium",
          status: "todo",
          dueDate: null,
        }),
      })
    );
  });

  it("should pass dueDate as Date object to prisma", async () => {
    await callRoute({
      title: "Task with due date",
      categoryId: "cat-1",
      priority: "high",
      dueDate: "2026-06-15T00:00:00.000Z",
    });

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dueDate: new Date("2026-06-15T00:00:00.000Z"),
        }),
      })
    );
  });

  it("should return 400 when title is missing", async () => {
    const response = await callRoute({ categoryId: "cat-1", priority: "low" });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 when title is empty string", async () => {
    const response = await callRoute({
      title: "",
      categoryId: "cat-1",
      priority: "low",
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Title is required");
  });

  it("should return 400 when categoryId is missing", async () => {
    const response = await callRoute({ title: "Task", priority: "low" });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 when priority is invalid", async () => {
    const response = await callRoute({
      title: "Task",
      categoryId: "cat-1",
      priority: "extreme",
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 when dueDate has invalid format", async () => {
    const response = await callRoute({
      title: "Task",
      categoryId: "cat-1",
      priority: "high",
      dueDate: "not-a-date",
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid date format");
  });

  it("should return 400 when body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest(
      new URL("/api/tasks", "http://localhost:3000"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("should default status to todo when not provided", async () => {
    await callRoute({
      title: "Task",
      categoryId: "cat-1",
      priority: "low",
    });

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "todo" }),
      })
    );
  });

  it("should accept a provided status value", async () => {
    await callRoute({
      title: "Task",
      categoryId: "cat-1",
      priority: "low",
      status: "in_progress",
    });

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "in_progress" }),
      })
    );
  });
});

describe("GET /api/tasks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueTask.mockResolvedValue(sampleTasks[0]);
  });

  async function callRoute(id: string) {
    const { GET } = await import("@/app/api/tasks/[id]/route");
    const request = new NextRequest(
      new URL(`/api/tasks/${id}`, "http://localhost:3000")
    );
    const context = { params: Promise.resolve({ id }) };
    return GET(request, context);
  }

  it("should return a single task by id", async () => {
    const response = await callRoute("task-1");

    expect(response.status).toBe(200);
    const data: TaskApiResponse = await response.json();
    expect(data.task.id).toBe("task-1");
    expect(data.task.title).toBe("Restock winter coats");
  });

  it("should serialize task dates to ISO strings", async () => {
    const response = await callRoute("task-1");
    const data: TaskApiResponse = await response.json();

    expect(data.task.dueDate).toBe("2026-04-01T00:00:00.000Z");
    expect(data.task.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("should include category data", async () => {
    const response = await callRoute("task-1");
    const data: TaskApiResponse = await response.json();

    expect(data.task.category).toEqual({
      id: "cat-1",
      name: "Inventory",
      color: "#3b82f6",
      icon: "📦",
    });
  });

  it("should call prisma.task.findUnique with the correct id", async () => {
    await callRoute("task-1");

    expect(mockFindUniqueTask).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "task-1" } })
    );
  });

  it("should return 404 when task is not found", async () => {
    mockFindUniqueTask.mockResolvedValue(null);

    const response = await callRoute("nonexistent-id");

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Task not found");
  });
});

describe("PUT /api/tasks/[id]", () => {
  const updatedTask = {
    ...sampleTasks[0],
    title: "Updated title",
    description: "Updated description",
    status: "done",
    priority: "urgent",
    dueDate: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T12:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueTask.mockResolvedValue(sampleTasks[0]);
    mockUpdateTask.mockResolvedValue(updatedTask);
  });

  async function callRoute(id: string, body: unknown) {
    const { PUT } = await import("@/app/api/tasks/[id]/route");
    const request = new NextRequest(
      new URL(`/api/tasks/${id}`, "http://localhost:3000"),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const context = { params: Promise.resolve({ id }) };
    return PUT(request, context);
  }

  const validUpdate = {
    title: "Updated title",
    description: "Updated description",
    categoryId: "cat-1",
    priority: "urgent",
    status: "done",
    dueDate: "2026-05-01T00:00:00.000Z",
  };

  it("should update a task and return 200 with updated data", async () => {
    const response = await callRoute("task-1", validUpdate);

    expect(response.status).toBe(200);
    const data: TaskApiResponse = await response.json();
    expect(data.task.title).toBe("Updated title");
    expect(data.task.status).toBe("done");
  });

  it("should call prisma.task.update with correct fields", async () => {
    await callRoute("task-1", validUpdate);

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task-1" },
        data: expect.objectContaining({
          title: "Updated title",
          categoryId: "cat-1",
          priority: "urgent",
          status: "done",
          dueDate: new Date("2026-05-01T00:00:00.000Z"),
        }),
      })
    );
  });

  it("should set dueDate to null when provided as null", async () => {
    await callRoute("task-1", { ...validUpdate, dueDate: null });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dueDate: null }),
      })
    );
  });

  it("should set dueDate to null when not provided", async () => {
    const noDate = {
      title: validUpdate.title,
      description: validUpdate.description,
      categoryId: validUpdate.categoryId,
      priority: validUpdate.priority,
      status: validUpdate.status,
    };
    await callRoute("task-1", noDate);

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dueDate: null }),
      })
    );
  });

  it("should return 404 when task is not found", async () => {
    mockFindUniqueTask.mockResolvedValue(null);

    const response = await callRoute("nonexistent-id", validUpdate);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Task not found");
  });

  it("should return 400 when title is empty", async () => {
    const response = await callRoute("task-1", { ...validUpdate, title: "" });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Title is required");
  });

  it("should return 400 when status is missing", async () => {
    const noStatus = {
      title: validUpdate.title,
      description: validUpdate.description,
      categoryId: validUpdate.categoryId,
      priority: validUpdate.priority,
      dueDate: validUpdate.dueDate,
    };
    const response = await callRoute("task-1", noStatus);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 when priority is invalid", async () => {
    const response = await callRoute("task-1", {
      ...validUpdate,
      priority: "extreme",
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 when dueDate is invalid format", async () => {
    const response = await callRoute("task-1", {
      ...validUpdate,
      dueDate: "2026/05/01",
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid date format");
  });

  it("should return 400 when body is not valid JSON", async () => {
    const { PUT } = await import("@/app/api/tasks/[id]/route");
    const request = new NextRequest(
      new URL("/api/tasks/task-1", "http://localhost:3000"),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }
    );
    const context = { params: Promise.resolve({ id: "task-1" }) };
    const response = await PUT(request, context);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("should serialize dates to ISO strings in response", async () => {
    const response = await callRoute("task-1", validUpdate);
    const data: TaskApiResponse = await response.json();

    expect(data.task.dueDate).toBe("2026-05-01T00:00:00.000Z");
    expect(data.task.updatedAt).toBe("2026-03-01T12:00:00.000Z");
  });
});
