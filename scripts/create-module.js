#!/usr/bin/env ts-node

import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join, relative } from "path";
import chalk from "chalk";

/* ---------------------------------- */
/* CONFIG */
/* ---------------------------------- */

const moduleName = process.argv[2];

if (!moduleName) {
  console.log();
  console.log(chalk.bgRed.white.bold(" ERROR "));
  console.log(chalk.red(" Please provide a module name.\n"));
  console.log(chalk.gray(" Usage:"));
  console.log(chalk.cyan("   npm run make auth\n"));
  process.exit(1);
}

const pascalName =
  moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

const root = process.cwd();
const moduleDir = join(root, "src", "modules", moduleName);
const schemaDir = join(root, "src", "shared", "database", "schemas");
const coreTypesDir = join(root, "src", "core", "types");

ensureDir(moduleDir);
ensureDir(schemaDir);
ensureDir(coreTypesDir);

printHeader(`Creating ${pascalName} Module`);

/* ---------------------------------- */
/* FILE TEMPLATES */
/* ---------------------------------- */

const files = {
  /* ---------------- SCHEMA ---------------- */

  [join(schemaDir, `${moduleName}.schema.ts`)]: `
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

export const ${moduleName}Table = pgTable('${moduleName}', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
`,

  /* ---------------- CORE TYPES DECLARATION ---------------- */

  [join(coreTypesDir, `${pascalName}.d.ts`)]: `
declare namespace ${pascalName}Module {
  interface BaseEntity {
    id: string;
    createdAt: Date;
  }
}
`,

  /* ---------------- LOCAL TYPES ---------------- */

  [join(moduleDir, `${moduleName}.types.ts`)]: `
import { ${moduleName}Table } from '@/shared/database/schemas/${moduleName}.schema.js';

export type ${pascalName} = typeof ${moduleName}Table.$inferSelect;
`,

  /* ---------------- DTO ---------------- */

  [join(moduleDir, `${moduleName}.dto.ts`)]: `
import { z } from 'zod';

export const ${moduleName}BaseSchema = z.object({
});
`,

  /* ---------------- SERVICE ---------------- */

  [join(moduleDir, `${moduleName}.service.ts`)]: `
import { db } from '@/config/database.config.js';
import { ${moduleName}Table } from '@/shared/database/schemas/${moduleName}.schema.js';
import type { ${pascalName} } from './${moduleName}.types.js';

export class ${pascalName}Service {
  constructor() {}

  async health(): Promise<${pascalName}[]> {
    return db.select().from(${moduleName}Table);
  }
}
`,

  /* ---------------- CONTROLLER ---------------- */

  [join(moduleDir, `${moduleName}.controller.ts`)]: `
import type { Request, Response } from "express";
import type { ${pascalName}Service } from "./${moduleName}.service.js";

export class ${pascalName}Controller {
  constructor(private readonly service: ${pascalName}Service) {}

  async health(req: Request, res: Response) {
    const data = await this.service.health();
    res.json({
      module: "${moduleName}",
      status: "ok",
      data,
    });
  }
}
`,

  /* ---------------- ROUTE (DI LAYER) ---------------- */

  [join(moduleDir, `${moduleName}.routes.ts`)]: `
import { Router } from "express";
import { ${pascalName}Controller } from "./${moduleName}.controller.js";
import { ${pascalName}Service } from "./${moduleName}.service.js";

const router = Router();

/* Dependency Injection Layer */
const service = new ${pascalName}Service();
const controller = new ${pascalName}Controller(service);

router.get("/health", controller.health.bind(controller));

export default router;
`,
};

/* ---------------------------------- */
/* FILE CREATION */
/* ---------------------------------- */

let created = 0;
let skipped = 0;

for (const [fullPath, content] of Object.entries(files)) {
  const displayPath = relative(root, fullPath);

  if (existsSync(fullPath)) {
    logSkipped(displayPath);
    skipped++;
  } else {
    writeFileSync(fullPath, content.trimStart(), "utf8");
    logCreated(displayPath);
    created++;
  }
}

/* ---------------------------------- */
/* SUMMARY */
/* ---------------------------------- */

printSummary(pascalName, created, skipped);

/* ---------------------------------- */
/* HELPERS */
/* ---------------------------------- */

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(
      `${chalk.gray("📁")} ${chalk.green("created")} ${chalk.cyan(
        relative(root, dirPath),
      )}`,
    );
  }
}

function logCreated(path) {
  console.log(
    `${chalk.bgGreen.black(" CREATE ")} ${chalk.cyan(path)}`
  );
}

function logSkipped(path) {
  console.log(
    `${chalk.bgYellow.black(" SKIP   ")} ${chalk.gray(path)}`
  );
}

function printHeader(title) {
  const width = title.length + 6;
  const top = "╔" + "═".repeat(width) + "╗";
  const middle =
    "║" +
    title
      .padStart((width + title.length) / 2)
      .padEnd(width) +
    "║";
  const bottom = "╚" + "═".repeat(width) + "╝";

  console.log();
  console.log(chalk.bold.blueBright(top));
  console.log(chalk.bold.white.bgBlue(middle));
  console.log(chalk.bold.blueBright(bottom));
  console.log();
}

function printSummary(name, created, skipped) {
  console.log();
  console.log(
    `${chalk.bgBlue.white(" DONE ")} ${chalk.bold(name)} module`
  );
  console.log(
    `  ${chalk.green("✔ created:")} ${created}   ${chalk.gray(
      "⏭ skipped:",
    )} ${skipped}`
  );
  console.log();
}