import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    name: "Inventory",
    color: "#3b82f6",
    icon: "package",
  },
  {
    name: "Restocking",
    color: "#10b981",
    icon: "refresh-cw",
  },
  {
    name: "Display",
    color: "#f59e0b",
    icon: "layout",
  },
  {
    name: "Seasonal",
    color: "#8b5cf6",
    icon: "calendar",
  },
  {
    name: "Operations",
    color: "#ef4444",
    icon: "settings",
  },
  {
    name: "Customer Service",
    color: "#ec4899",
    icon: "users",
  },
] as const;

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();

  console.log("Creating categories...");

  for (const category of CATEGORIES) {
    await prisma.category.create({
      data: category,
    });
    console.log(`Created category: ${category.name}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("Error during seed:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
