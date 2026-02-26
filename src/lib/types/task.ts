import type { Status, Priority } from "@/generated/prisma";

export interface TaskWithCategory {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface TasksApiResponse {
  tasks: TaskWithCategory[];
  categories: CategorySummary[];
}
