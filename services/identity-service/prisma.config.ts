import "dotenv/config";
import { defineConfig } from "prisma/config";

const URL: string = process.env["DATABASE_URL"] || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: URL,
  },
});
