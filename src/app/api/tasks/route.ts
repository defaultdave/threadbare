import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { taskQuerySchema, createTaskSchema } from "@/lib/validators/task";
import {
  serializeTask,
  taskWithCategoryInclude,
  taskDefaultOrderBy,
  categorySummarySelect,
} from "@/lib/utils/task";
import type { Prisma } from "@/generated/prisma/client";
import type { TasksApiResponse, TaskApiResponse } from "@/lib/types/task";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  const rawParams: Record<string, string> = {};
  const statusParam = searchParams.get("status");
  const categoryIdParam = searchParams.get("categoryId");

  if (statusParam !== null) rawParams.status = statusParam;
  if (categoryIdParam !== null) rawParams.categoryId = categoryIdParam;

  const parsed = taskQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const { status, categoryId } = parsed.data;

  const where: Prisma.TaskWhereInput = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;

  const [tasks, categories] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskWithCategoryInclude,
      orderBy: taskDefaultOrderBy,
    }),
    prisma.category.findMany({
      select: categorySummarySelect,
      orderBy: { name: "asc" },
    }),
  ]);

  const response: TasksApiResponse = {
    tasks: tasks.map(serializeTask),
    categories,
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const { title, description, categoryId, priority, dueDate, status } =
    parsed.data;

  try {
    const task = await prisma.task.create({
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
    return NextResponse.json(response, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
