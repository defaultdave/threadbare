import { ClipboardList } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
      role="status"
      aria-label="No tasks found"
    >
      <ClipboardList
        className="h-12 w-12 text-muted-foreground/50"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-semibold">No tasks found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your filters to find what you're looking for."
          : "There are no tasks yet. Tasks will appear here once they are created."}
      </p>
    </div>
  );
}
