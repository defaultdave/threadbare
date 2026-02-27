"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategorySummary } from "@/lib/types/task";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

interface TaskFiltersProps {
  categories: CategorySummary[];
}

const VALID_STATUS_VALUES = new Set(STATUS_OPTIONS.map((o) => o.value));

export function TaskFilters({ categories }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get("status") ?? "all";
  const rawCategory = searchParams.get("categoryId") ?? "all";

  const currentStatus = VALID_STATUS_VALUES.has(rawStatus) ? rawStatus : "all";
  const validCategoryIds = new Set(categories.map((c) => c.id));
  const currentCategory =
    rawCategory === "all" || validCategoryIds.has(rawCategory)
      ? rawCategory
      : "all";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.push(query ? `/tasks?${query}` : "/tasks");
    },
    [router, searchParams]
  );

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      role="group"
      aria-label="Task filters"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="status-filter"
          className="text-xs font-medium text-muted-foreground"
        >
          Status
        </label>
        <Select
          value={currentStatus}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger id="status-filter" className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="category-filter"
          className="text-xs font-medium text-muted-foreground"
        >
          Category
        </label>
        <Select
          value={currentCategory}
          onValueChange={(value) => updateFilter("categoryId", value)}
        >
          <SelectTrigger id="category-filter" className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{category.icon}</span>
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
