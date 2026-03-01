"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { taskFormSchema, type TaskFormValues } from "@/lib/validators/task";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategorySummary, TaskWithCategory } from "@/lib/types/task";

interface TaskFormProps {
  /** Existing task to edit. When omitted the form is in create mode. */
  task?: TaskWithCategory;
  categories: CategorySummary[];
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

type FieldErrors = Partial<Record<keyof TaskFormValues, string>>;

/** Convert an ISO datetime string (from the DB) to a YYYY-MM-DD string for the date input. */
function isoToDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  // iso is like "2026-04-15T00:00:00.000Z"
  return iso.slice(0, 10);
}

/** Convert a YYYY-MM-DD string to an ISO 8601 datetime string (midnight UTC). */
function dateInputToIso(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function TaskForm({ task, categories }: TaskFormProps) {
  const router = useRouter();
  const isEdit = Boolean(task);

  const [values, setValues] = useState<TaskFormValues>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    categoryId: task?.categoryId ?? "",
    priority: task?.priority ?? "medium",
    dueDate: isoToDateInputValue(task?.dueDate),
    status: task?.status ?? "todo",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof TaskFormValues, value: string) => {
      const partialResult = taskFormSchema.safeParse({ ...values, [name]: value });
      if (!partialResult.success) {
        const fieldError = partialResult.error.flatten().fieldErrors[name];
        return fieldError?.[0] ?? null;
      }
      return null;
    },
    [values]
  );

  const handleBlur = useCallback(
    (name: keyof TaskFormValues) => {
      const error = validateField(name, String(values[name] ?? ""));
      setErrors((prev) => ({ ...prev, [name]: error ?? undefined }));
    },
    [validateField, values]
  );

  const handleChange = useCallback(
    (name: keyof TaskFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error on change if field had an error
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleSelectChange = useCallback(
    (name: keyof TaskFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    // Full validation before submit
    const result = taskFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])
        ) as FieldErrors
      );
      return;
    }

    const { title, description, categoryId, priority, dueDate, status } = result.data;

    const body = {
      title,
      description: description ?? "",
      categoryId,
      priority,
      dueDate: dateInputToIso(dueDate ?? ""),
      status,
    };

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/tasks/${task!.id}` : "/api/tasks";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/tasks");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/tasks");
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? "Edit task" : "Create task"}>
      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            type="text"
            value={values.title}
            onChange={(e) => handleChange("title", e.target.value)}
            onBlur={() => handleBlur("title")}
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            autoFocus
            placeholder="e.g. Restock winter coats"
            disabled={isSubmitting}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-destructive" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={values.description ?? ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Optional details about this task..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">
            Category <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Select
            value={values.categoryId}
            onValueChange={(v) => handleSelectChange("categoryId", v)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="category"
              aria-required="true"
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={errors.categoryId ? "category-error" : undefined}
              className={cn(errors.categoryId && "border-destructive")}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p id="category-error" className="text-sm text-destructive" role="alert">
              {errors.categoryId}
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <Label htmlFor="priority">
            Priority <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Select
            value={values.priority}
            onValueChange={(v) => handleSelectChange("priority", v)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="priority"
              aria-required="true"
              aria-invalid={Boolean(errors.priority)}
              aria-describedby={errors.priority ? "priority-error" : undefined}
              className={cn(errors.priority && "border-destructive")}
            >
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && (
            <p id="priority-error" className="text-sm text-destructive" role="alert">
              {errors.priority}
            </p>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            value={values.dueDate ?? ""}
            onChange={(e) => handleChange("dueDate", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Status (edit mode only) */}
        {isEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="status">
              Status <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select
              value={values.status ?? "todo"}
              onValueChange={(v) => handleSelectChange("status", v)}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="status"
                aria-required="true"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
