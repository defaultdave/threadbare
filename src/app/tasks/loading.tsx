import { TaskListSkeleton } from "@/components/shared/task-list-skeleton";

export default function TasksLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="h-8 w-32 animate-pulse rounded bg-primary/10" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-primary/10" />
      </header>
      <section aria-label="Loading tasks">
        <TaskListSkeleton />
      </section>
    </main>
  );
}
