import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "frontend/prisma/schema.prisma",
  migrations: {
    path: "frontend/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
