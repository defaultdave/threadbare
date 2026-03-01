import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatDueDate,
  getDueDateStyle,
  startOfDay,
  diffCalendarDays,
} from "../task-card";

describe("startOfDay", () => {
  it("normalizes a date to midnight", () => {
    const d = new Date("2026-03-15T14:30:00Z");
    const result = startOfDay(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("does not mutate the original date", () => {
    const d = new Date("2026-03-15T14:30:00Z");
    const original = d.getTime();
    startOfDay(d);
    expect(d.getTime()).toBe(original);
  });
});

describe("diffCalendarDays", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for same calendar day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(diffCalendarDays("2026-03-15T23:59:59")).toBe(0);
  });

  it("returns negative for past dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(diffCalendarDays("2026-03-14T10:00:00")).toBe(-1);
  });

  it("returns positive for future dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(diffCalendarDays("2026-03-17T10:00:00")).toBe(2);
  });
});

describe("formatDueDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Overdue" for past dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(formatDueDate("2026-03-14T23:59:59")).toBe("Overdue");
  });

  it('returns "Overdue" for a due date earlier the same day that is already past (the original bug)', () => {
    vi.useFakeTimers();
    // It's 3pm on March 15 — a task due at 8am on March 15 should be "Due today" not "Overdue"
    // because we normalize to calendar days, not exact time
    vi.setSystemTime(new Date("2026-03-15T15:00:00"));
    // Due date is earlier today — should still be "Due today" since same calendar day
    expect(formatDueDate("2026-03-15T08:00:00")).toBe("Due today");
  });

  it('returns "Due today" for due dates today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T08:00:00"));
    expect(formatDueDate("2026-03-15T23:00:00")).toBe("Due today");
  });

  it('returns "Due tomorrow" for due dates tomorrow', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(formatDueDate("2026-03-16T10:00:00")).toBe("Due tomorrow");
  });

  it("returns formatted date for dates further out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    const result = formatDueDate("2026-03-20T10:00:00");
    expect(result).toContain("Mar");
    expect(result).toContain("20");
  });
});

describe("getDueDateStyle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns red for overdue tasks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(getDueDateStyle("2026-03-14T10:00:00")).toContain("text-red-600");
  });

  it("returns red for tasks due earlier the same day (past time, same calendar day should be orange not red)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T15:00:00"));
    // Same calendar day = diffDays 0 => orange (due today/tomorrow range)
    expect(getDueDateStyle("2026-03-15T08:00:00")).toContain("text-orange-600");
  });

  it("returns orange for tasks due today or tomorrow", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(getDueDateStyle("2026-03-15T23:00:00")).toContain("text-orange-600");
    expect(getDueDateStyle("2026-03-16T10:00:00")).toContain("text-orange-600");
  });

  it("returns muted for future tasks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00"));
    expect(getDueDateStyle("2026-03-20T10:00:00")).toContain("text-muted-foreground");
  });
});
