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
