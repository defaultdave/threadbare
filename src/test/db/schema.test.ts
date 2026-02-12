import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Status, Priority } from "@/generated/prisma/client";

describe("Database Schema", () => {
  let prisma: PrismaClient;
  let pool: Pool;

  beforeAll(async () => {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  describe("Category model", () => {
    it("should create a category with all required fields", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Test Category",
          color: "#ff0000",
          icon: "test-icon",
        },
      });

      expect(category.id).toBeDefined();
      expect(category.name).toBe("Test Category");
      expect(category.color).toBe("#ff0000");
      expect(category.icon).toBe("test-icon");
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);

      // Clean up
      await prisma.category.delete({ where: { id: category.id } });
    });

    it("should enforce unique name constraint", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Unique Test",
          color: "#00ff00",
          icon: "icon",
        },
      });

      await expect(
        prisma.category.create({
          data: {
            name: "Unique Test",
            color: "#0000ff",
            icon: "icon2",
          },
        })
      ).rejects.toThrow();

      // Clean up
      await prisma.category.delete({ where: { id: category.id } });
    });
  });

  describe("Task model", () => {
    it("should create a task with default status and priority", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Task Test Category",
          color: "#ffffff",
          icon: "icon",
        },
      });

      const task = await prisma.task.create({
        data: {
          title: "Test Task",
          categoryId: category.id,
        },
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe("Test Task");
      expect(task.description).toBeNull();
      expect(task.status).toBe(Status.todo);
      expect(task.priority).toBe(Priority.medium);
      expect(task.dueDate).toBeNull();
      expect(task.categoryId).toBe(category.id);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);

      // Clean up
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.category.delete({ where: { id: category.id } });
    });

    it("should create a task with all fields specified", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Full Task Category",
          color: "#000000",
          icon: "icon",
        },
      });

      const dueDate = new Date("2026-12-31");
      const task = await prisma.task.create({
        data: {
          title: "Complete Task",
          description: "Task description",
          status: Status.in_progress,
          priority: Priority.urgent,
          dueDate,
          categoryId: category.id,
        },
      });

      expect(task.title).toBe("Complete Task");
      expect(task.description).toBe("Task description");
      expect(task.status).toBe(Status.in_progress);
      expect(task.priority).toBe(Priority.urgent);
      expect(task.dueDate).toEqual(dueDate);

      // Clean up
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.category.delete({ where: { id: category.id } });
    });

    it("should cascade delete tasks when category is deleted", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Cascade Test",
          color: "#123456",
          icon: "icon",
        },
      });

      const task = await prisma.task.create({
        data: {
          title: "Will be deleted",
          categoryId: category.id,
        },
      });

      await prisma.category.delete({ where: { id: category.id } });

      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(deletedTask).toBeNull();
    });

    it("should support all status enum values", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Status Test",
          color: "#111111",
          icon: "icon",
        },
      });

      for (const status of [Status.todo, Status.in_progress, Status.done]) {
        const task = await prisma.task.create({
          data: {
            title: `Task ${status}`,
            status,
            categoryId: category.id,
          },
        });

        expect(task.status).toBe(status);
        await prisma.task.delete({ where: { id: task.id } });
      }

      await prisma.category.delete({ where: { id: category.id } });
    });

    it("should support all priority enum values", async () => {
      const category = await prisma.category.create({
        data: {
          name: "Priority Test",
          color: "#222222",
          icon: "icon",
        },
      });

      for (const priority of [
        Priority.low,
        Priority.medium,
        Priority.high,
        Priority.urgent,
      ]) {
        const task = await prisma.task.create({
          data: {
            title: `Task ${priority}`,
            priority,
            categoryId: category.id,
          },
        });

        expect(task.priority).toBe(priority);
        await prisma.task.delete({ where: { id: task.id } });
      }

      await prisma.category.delete({ where: { id: category.id } });
    });
  });

  describe("Seed data", () => {
    it("should have 6 predefined categories", async () => {
      const categories = await prisma.category.findMany();
      expect(categories.length).toBeGreaterThanOrEqual(6);

      const categoryNames = categories.map((c) => c.name);
      expect(categoryNames).toContain("Inventory");
      expect(categoryNames).toContain("Restocking");
      expect(categoryNames).toContain("Display");
      expect(categoryNames).toContain("Seasonal");
      expect(categoryNames).toContain("Operations");
      expect(categoryNames).toContain("Customer Service");
    });

    it("should have valid colors for all categories", async () => {
      const categories = await prisma.category.findMany();

      for (const category of categories) {
        expect(category.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it("should have icons for all categories", async () => {
      const categories = await prisma.category.findMany();

      for (const category of categories) {
        expect(category.icon).toBeTruthy();
        expect(category.icon.length).toBeGreaterThan(0);
      }
    });
  });
});
