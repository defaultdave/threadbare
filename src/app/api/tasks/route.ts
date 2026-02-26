import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { taskQuerySchema } from "@/lib/validators/task";
import type { Prisma } from "@/generated/prisma/client";
import type { TasksApiResponse, TaskWithCategory } from "@/lib/types/task";

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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTasks: TaskWithCategory[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    categoryId: task.categoryId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    category: task.category,
  }));

  const response: TasksApiResponse = {
    tasks: serializedTasks,
    categories,
  };

  return NextResponse.json(response);
}
