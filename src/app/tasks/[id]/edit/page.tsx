import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TaskForm } from "@/components/shared/task-form";
import { categorySummarySelect, taskWithCategoryInclude, serializeTask } from "@/lib/utils/task";
import type { Metadata } from "next";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditTaskPageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });

  return {
    title: task ? `Edit "${task.title}" | Threadbare` : "Edit Task | Threadbare",
    description: "Edit an existing task",
  };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;

  const [rawTask, categories] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: taskWithCategoryInclude,
    }),
    prisma.category.findMany({
      select: categorySummarySelect,
      orderBy: { name: "asc" },
    }),
  ]);

  if (!rawTask) {
    notFound();
  }

  const task = serializeTask(rawTask);

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details for &ldquo;{task.title}&rdquo;.
        </p>
      </header>
      <TaskForm task={task} categories={categories} />
    </main>
  );
}
