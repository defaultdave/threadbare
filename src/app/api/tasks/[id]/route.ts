import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validators/task";
import { serializeTask, taskWithCategoryInclude } from "@/lib/utils/task";
import type { TaskApiResponse } from "@/lib/types/task";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskWithCategoryInclude,
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const response: TaskApiResponse = { task: serializeTask(task) };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const { title, description, categoryId, priority, dueDate, status } =
    parsed.data;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description: description ?? null,
        categoryId,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
      },
      include: taskWithCategoryInclude,
    });

    const response: TaskApiResponse = { task: serializeTask(task) };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
