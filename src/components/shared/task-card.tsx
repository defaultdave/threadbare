import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { TaskWithCategory } from "@/lib/types/task";
import type { Priority, Status } from "@/generated/prisma";

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
  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    className: "text-red-600 dark:text-red-400",
  },
  high: {
    label: "High",
    icon: ArrowUp,
    className: "text-orange-600 dark:text-orange-400",
  },
  medium: {
    label: "Medium",
    icon: Minus,
    className: "text-yellow-600 dark:text-yellow-400",
  },
  low: {
    label: "Low",
    icon: ArrowDown,
    className: "text-green-600 dark:text-green-400",
  },
};

/** Normalize a Date to midnight (start of day) in local time. */
function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Get the difference in calendar days between a due date and today. */
function diffCalendarDays(isoDate: string): number {
  const dueDay = startOfDay(new Date(isoDate));
  const today = startOfDay(new Date());
  const diffMs = dueDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDueDate(isoDate: string): string {
  const diffDays = diffCalendarDays(isoDate);

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDueDateStyle(isoDate: string): string {
  const diffDays = diffCalendarDays(isoDate);

  if (diffDays < 0) return "text-red-600 dark:text-red-400";
  if (diffDays <= 1) return "text-orange-600 dark:text-orange-400";
  return "text-muted-foreground";
}

interface TaskCardProps {
  task: TaskWithCategory;
}

export function TaskCard({ task }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;

  return (
    <article aria-label={`Task: ${task.title}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {task.title}
            </CardTitle>
            <Badge
              className={cn(
                "shrink-0 border-0 text-xs",
                statusStyles[task.status]
              )}
              variant="secondary"
            >
              {statusLabels[task.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge
              variant="outline"
              className="gap-1"
              style={{
                borderColor: task.category.color,
                color: task.category.color,
              }}
            >
              <span aria-hidden="true">{task.category.icon}</span>
              {task.category.name}
            </Badge>

            <span
              className={cn("flex items-center gap-1", priority.className)}
              aria-label={`Priority: ${priority.label}`}
            >
              <PriorityIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs font-medium">{priority.label}</span>
            </span>

            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  getDueDateStyle(task.dueDate)
                )}
                aria-label={`Due date: ${formatDueDate(task.dueDate)}`}
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{formatDueDate(task.dueDate)}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

export { statusLabels, statusStyles, priorityConfig, formatDueDate, getDueDateStyle, startOfDay, diffCalendarDays };
