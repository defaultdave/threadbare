import { z } from "zod";

export const statusEnum = z.enum(["todo", "in_progress", "done"]);
export type StatusFilter = z.infer<typeof statusEnum>;

export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export type PriorityFilter = z.infer<typeof priorityEnum>;

export const taskQuerySchema = z.object({
  status: statusEnum.optional(),
  categoryId: z.string().optional(),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
