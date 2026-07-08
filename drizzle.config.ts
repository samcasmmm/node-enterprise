import { defineConfig } from 'drizzle-kit';
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), "env/.env.dev"),
  override: true
});

export default defineConfig({
  out: './src/database/migrations',
  schema: "./src/database/schemas/**/*.ts",
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});