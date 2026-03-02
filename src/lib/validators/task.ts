import { z } from "zod";

/** Preprocess empty strings to undefined so they act as "no filter". */
const emptyToUndefined = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional()
);

export const statusEnum = z.enum(["todo", "in_progress", "done"]);
export type StatusFilter = z.infer<typeof statusEnum>;

export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export type PriorityFilter = z.infer<typeof priorityEnum>;

export const taskQuerySchema = z.object({
  status: z.preprocess(
    (val) => (val === "" ? undefined : val),
    statusEnum.optional()
  ),
  categoryId: emptyToUndefined,
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;

/**
 * Schema for creating a new task.
 * - title: required, non-empty string
 * - description: optional, nullable string; empty string is converted to null
 * - categoryId: required, non-empty string
 * - priority: required enum value
 * - dueDate: optional ISO 8601 datetime string with offset (validated as string)
 * - status: optional, defaults to "todo"
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  categoryId: z.string().min(1, "Category is required"),
  priority: priorityEnum,
  dueDate: z
    .string()
    .datetime({ offset: true, message: "Invalid date format" })
    .optional(),
  status: statusEnum.default("todo"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Schema for updating an existing task.
 * - title, categoryId, priority, and status are required.
 * - description: optional, nullable; empty string is converted to null.
 * - dueDate: optional, nullable; null clears the date, valid ISO 8601 string sets it.
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  categoryId: z.string().min(1, "Category is required"),
  priority: priorityEnum,
  dueDate: z
    .string()
    .datetime({ offset: true, message: "Invalid date format" })
    .nullable()
    .optional(),
  status: statusEnum,
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Client-side form schema for creating/editing tasks.
 * Uses a plain date string (YYYY-MM-DD) from the HTML date input.
 * The form component converts this to an ISO 8601 datetime before submitting.
 */
export const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  priority: priorityEnum,
  /** YYYY-MM-DD from the HTML date input, or empty string if not set. */
  dueDate: z.string().optional(),
  status: statusEnum.optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
