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
const coreTypesDir = join(root, "src", "core", "types");

ensureDir(moduleDir);
ensureDir(coreTypesDir);

printHeader(`Creating ${pascalName} Module`);

/* ---------------------------------- */
/* FILE TEMPLATES */
/* ---------------------------------- */

const files = {
  /* ---------------- CORE TYPES DECLARATION ---------------- */

  [join(coreTypesDir, `${pascalName}.d.ts`)]: `
declare namespace ${pascalName}Module {
  interface BaseEntity {
    id: string;
    createdAt: Date;
  }
}
`,

  /* ---------------- DTO & TYPES ---------------- */

  [join(moduleDir, `${moduleName}.dto.ts`)]: `
import { z } from 'zod';

export const ${moduleName}BaseSchema = z.object({
});

export type ${pascalName}Dto = z.infer<typeof ${moduleName}BaseSchema>;

export interface ${pascalName} {
  id: string;
  createdAt: Date;
}
`,

  /* ---------------- SERVICE ---------------- */
  
  [join(moduleDir, `${moduleName}.service.ts`)]: `
import type { ${pascalName} } from './${moduleName}.dto.js';

export async function health(): Promise<${pascalName}[]> {
  return [
    {
      id: '1',
      createdAt: new Date(),
    }
  ];
}
`,

  /* ---------------- CONTROLLER ---------------- */

  [join(moduleDir, `${moduleName}.controller.ts`)]: `
import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as service from './${moduleName}.service.js';

export const health = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await service.health();
  res.json({
    module: '${moduleName}',
    status: 'ok',
    data,
  });
});
`,

  /* ---------------- ROUTE ---------------- */

  [join(moduleDir, `${moduleName}.routes.ts`)]: `
import { Router } from 'express';
import * as controller from './${moduleName}.controller.js';

const router = Router();

/**
 * @openapi
 * /api/${moduleName}/health:
 *   get:
 *     summary: Retrieve health status for ${moduleName}
 *     tags:
 *       - ${pascalName}
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
router.get('/health', controller.health);

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