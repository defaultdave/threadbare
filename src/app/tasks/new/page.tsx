import { prisma } from "@/lib/db";
import { TaskForm } from "@/components/shared/task-form";
import { categorySummarySelect } from "@/lib/utils/task";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Task | Threadbare",
  description: "Create a new task",
};

export default async function NewTaskPage() {
  const categories = await prisma.category.findMany({
    select: categorySummarySelect,
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below to create a new task.
        </p>
      </header>
      <TaskForm categories={categories} />
    </main>
  );
}
