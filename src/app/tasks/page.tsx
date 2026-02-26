import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { taskQuerySchema } from "@/lib/validators/task";
import { TaskCard } from "@/components/shared/task-card";
import { TaskFilters } from "@/components/shared/task-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskListSkeleton } from "@/components/shared/task-list-skeleton";
import type { Prisma } from "@/generated/prisma/client";
import type { TaskWithCategory, CategorySummary } from "@/lib/types/task";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks | Threadbare",
  description: "View and manage your store tasks",
};

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function TaskList({
  status,
  categoryId,
}: {
  status?: string;
  categoryId?: string;
}) {
  const where: Prisma.TaskWhereInput = {};

  const parsed = taskQuerySchema.safeParse({
    status: status ?? undefined,
    categoryId: categoryId ?? undefined,
  });

  if (parsed.success) {
    if (parsed.data.status) where.status = parsed.data.status;
    if (parsed.data.categoryId) where.categoryId = parsed.data.categoryId;
  }

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

  const categorySummaries: CategorySummary[] = categories;

  const hasFilters = Boolean(status || categoryId);

  return (
    <>
      <TaskFilters categories={categorySummaries} />
      {serializedTasks.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="grid gap-3">
          {serializedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const status = normalizeParam(params.status);
  const categoryId = normalizeParam(params.categoryId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your store tasks and stay on top of what needs to be done.
        </p>
      </header>
      <section className="space-y-4" aria-label="Task list">
        <Suspense fallback={<TaskListSkeleton />}>
          <TaskList status={status} categoryId={categoryId} />
        </Suspense>
      </section>
    </main>
  );
}
