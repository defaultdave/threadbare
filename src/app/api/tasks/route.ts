import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { taskQuerySchema } from "@/lib/validators/task";
import {
  serializeTask,
  taskWithCategoryInclude,
  taskDefaultOrderBy,
  categorySummarySelect,
} from "@/lib/utils/task";
import type { Prisma } from "@/generated/prisma/client";
import type { TasksApiResponse } from "@/lib/types/task";

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
