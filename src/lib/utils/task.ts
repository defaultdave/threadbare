import type { Prisma } from "@/generated/prisma/client";
import type { TaskWithCategory } from "@/lib/types/task";

/** Shared Prisma include for tasks with their category. */
export const taskWithCategoryInclude = {
  category: {
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
    },
  },
} satisfies Prisma.TaskInclude;

/** Shared ordering for task lists. */
export const taskDefaultOrderBy = [
  { dueDate: "asc" },
  { priority: "desc" },
  { createdAt: "desc" },
] satisfies Prisma.TaskOrderByWithRelationInput[];

/** Shared Prisma select for category summaries. */
export const categorySummarySelect = {
  id: true,
  name: true,
  color: true,
  icon: true,
} satisfies Prisma.CategorySelect;

type PrismaTaskWithCategory = Prisma.TaskGetPayload<{
  include: typeof taskWithCategoryInclude;
}>;

/** Serialize a Prisma task (with category) into the API-safe TaskWithCategory shape. */
export function serializeTask(task: PrismaTaskWithCategory): TaskWithCategory {
  return {
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
  };
}
