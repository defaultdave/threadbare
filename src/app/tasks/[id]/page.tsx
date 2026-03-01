import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { taskWithCategoryInclude, serializeTask } from "@/lib/utils/task";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Pencil, ArrowLeft, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { Priority, Status } from "@/generated/prisma/client";
import type { Metadata } from "next";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });

  return {
    title: task ? `${task.title} | Threadbare` : "Task | Threadbare",
    description: task?.description ?? "Task details",
  };
}

const statusLabels: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const statusStyles: Record<Status, string> = {
  todo: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

interface PriorityConfig {
  label: string;
  icon: typeof ArrowUp;
  className: string;
}

const priorityConfig: Record<Priority, PriorityConfig> = {
  urgent: { label: "Urgent", icon: AlertTriangle, className: "text-red-600 dark:text-red-400" },
  high: { label: "High", icon: ArrowUp, className: "text-orange-600 dark:text-orange-400" },
  medium: { label: "Medium", icon: Minus, className: "text-yellow-600 dark:text-yellow-400" },
  low: { label: "Low", icon: ArrowDown, className: "text-green-600 dark:text-green-400" },
};

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  const rawTask = await prisma.task.findUnique({
    where: { id },
    include: taskWithCategoryInclude,
  });

  if (!rawTask) {
    notFound();
  }

  const task = serializeTask(rawTask);
  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to tasks"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Tasks
        </Link>
      </nav>

      <article aria-label={`Task: ${task.title}`}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-xl leading-snug">{task.title}</CardTitle>
              <Link
                href={`/tasks/${task.id}/edit`}
                aria-label={`Edit task: ${task.title}`}
                className={buttonVariants({ size: "sm" }) + " shrink-0"}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge
                className={cn("border-0 text-xs", statusStyles[task.status])}
                variant="secondary"
              >
                {statusLabels[task.status]}
              </Badge>

              <Badge
                variant="outline"
                className="gap-1"
                style={{ borderColor: task.category.color, color: task.category.color }}
              >
                <span aria-hidden="true">{task.category.icon}</span>
                {task.category.name}
              </Badge>

              <span
                className={cn("flex items-center gap-1 text-sm", priority.className)}
                aria-label={`Priority: ${priority.label}`}
              >
                <PriorityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-medium">{priority.label}</span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {task.description && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-1">Description</h2>
                <p className="text-sm leading-relaxed">{task.description}</p>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
            )}

            <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
              <p>Created {formatDate(task.createdAt)}</p>
              <p>Last updated {formatDate(task.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </article>
    </main>
  );
}
