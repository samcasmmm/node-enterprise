#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * scripts/create-module.js  (npm run make)
 *
 * Scaffolds a new module (an HRMS entity, a CRM entity, anything) using the
 * exact same BaseRepository/BaseService/BaseController/buildCrudRouter
 * pattern as the core modules (see src/modules/tenant/* as the reference
 * implementation). This is what makes "100+ modules" tractable: each one is
 * a ~5-file, mostly-generated stack instead of hand-rolled boilerplate.
 *
 * It does NOT:
 *  - touch core/container/tokens.ts or register.ts (prints the snippets to add — kept manual, deliberately, since decorator-based DI can't be safely code-modded)
 *  - mount the router in modules/index.ts (same reason)
 *
 * Usage:
 *   npm run make
 */

function toPascalCase(input) {
  return input
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toCamelCase(input) {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function toKebabCase(input) {
  return toSnakeCase(input).replace(/_/g, '-');
}

async function main() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'moduleGroup',
      message: 'Module group / package (e.g. hrms, crm, inventory):',
      validate: (v) => (v.trim().length > 0 ? true : 'Required'),
    },
    {
      type: 'input',
      name: 'entityName',
      message: 'Entity name, singular, PascalCase (e.g. Payroll, Invoice, Lead):',
      validate: (v) => (v.trim().length > 0 ? true : 'Required'),
    },
    {
      type: 'confirm',
      name: 'tenantScoped',
      message: 'Does this entity belong to a tenant (tenantId column + scoping)?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'softDelete',
      message: 'Enable soft delete (deletedAt column)?',
      default: true,
    },
  ]);

  const { moduleGroup, entityName, tenantScoped, softDelete } = answers;

  const group = toKebabCase(moduleGroup);
  const Entity = toPascalCase(entityName);
  const entity = toCamelCase(entityName);
  const entitySnake = toSnakeCase(entityName);
  const tableName = `${entitySnake}s`;
  const permissionKey = `${group}.${entitySnake}`;

  const moduleDir = path.resolve(process.cwd(), 'src/modules', group, entitySnake.replace(/_/g, '-'));
  fs.mkdirSync(moduleDir, { recursive: true });

  const schemaDir = path.resolve(process.cwd(), 'src/database/schemas/modules', group);
  fs.mkdirSync(schemaDir, { recursive: true });

  const files = {};

  // --- Schema -------------------------------------------------------------
  files[`${schemaDir}/${entitySnake}.schema.ts`] = `import { pgTable, varchar, text, bigint } from 'drizzle-orm/pg-core';
import { idColumn, timestamps, isActiveColumn } from '@/database/schemas/core/_shared.columns.js';
${tenantScoped ? "import { tenantsTable } from '@/database/schemas/core/multi-tenancy.schema.js';\n" : ''}
export const ${entity}sTable = pgTable('${tableName}', {
  id: idColumn(),
${tenantScoped ? "  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),\n" : ''}  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  isActive: isActiveColumn(),
${softDelete ? '  ...timestamps,\n' : '  ...timestamps, // includes deletedAt; remove manually if you truly do not want soft delete\n'}});

export type ${Entity} = typeof ${entity}sTable.$inferSelect;
export type New${Entity} = typeof ${entity}sTable.$inferInsert;
`;

  // --- Repository -----------------------------------------------------------
  files[`${moduleDir}/${entitySnake}.repository.ts`] = `import { injectable } from 'tsyringe';
import { ${entity}sTable, type ${Entity}, type New${Entity} } from '@/database/schemas/modules/${group}/${entitySnake}.schema.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class ${Entity}Repository extends BaseRepository<typeof ${entity}sTable, ${Entity}, New${Entity}> {
  constructor() {
    super(${entity}sTable);
  }
}
`;

  // --- Service --------------------------------------------------------------
  files[`${moduleDir}/${entitySnake}.service.ts`] = `import { inject, injectable } from 'tsyringe';
import { BaseService } from '@/core/base/base.service.js';
import type { ${Entity}, New${Entity} } from '@/database/schemas/modules/${group}/${entitySnake}.schema.js';
import type { ${Entity}Repository } from './${entitySnake}.repository.js';

@injectable()
export class ${Entity}Service extends BaseService<${Entity}, New${Entity}> {
  constructor(@inject('${Entity}Repository') ${entity}Repository: ${Entity}Repository) {
    super(${entity}Repository, '${Entity}');
  }
}
`;

  // --- Controller -----------------------------------------------------------
  files[`${moduleDir}/${entitySnake}.controller.ts`] = `import { inject, injectable } from 'tsyringe';
import { BaseController } from '@/core/base/base.controller.js';
import type { ${Entity}, New${Entity} } from '@/database/schemas/modules/${group}/${entitySnake}.schema.js';
import type { ${Entity}Service } from './${entitySnake}.service.js';

@injectable()
export class ${Entity}Controller extends BaseController<${Entity}, New${Entity}> {
  constructor(@inject('${Entity}Service') ${entity}Service: ${Entity}Service) {
    super(${entity}Service, '${entitySnake}');
  }
}
`;

  // --- Validation -------------------------------------------------------------
  files[`${moduleDir}/${entitySnake}.validation.ts`] = `import { z } from 'zod';

export const create${Entity}Schema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
});

export const update${Entity}Schema = create${Entity}Schema.partial();
`;

  // --- Routes -----------------------------------------------------------------
  files[`${moduleDir}/${entitySnake}.routes.ts`] = `import { Router } from 'express';
import { container } from 'tsyringe';
import { buildCrudRouter } from '@/core/base/base.route.js';
import { create${Entity}Schema, update${Entity}Schema } from './${entitySnake}.validation.js';
import { ${Entity}Controller } from './${entitySnake}.controller.js';

const router: Router = Router();
const controller = container.resolve(${Entity}Controller);

router.use(
  '/',
  buildCrudRouter(controller, {
    permissionKey: '${permissionKey}',
    createSchema: create${Entity}Schema as any,
    updateSchema: update${Entity}Schema as any,
  }),
);

export default router;
`;

  for (const [filePath, content] of Object.entries(files)) {
    if (fs.existsSync(filePath)) {
      console.log(chalk.yellow(`  skip (exists): ${path.relative(process.cwd(), filePath)}`));
      continue;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(chalk.green(`  created: ${path.relative(process.cwd(), filePath)}`));
  }

  console.log('\n' + chalk.bold('Next steps (manual — decorator DI can\'t be safely code-modded):'));
  console.log(chalk.cyan(`
1. Export the schema from src/database/schemas/index.ts:
     export * from './modules/${group}/${entitySnake}.schema.js';

2. Register the module in modules_catalog (if it's a purchasable, non-core module):
     INSERT INTO modules_catalog (key, name) VALUES ('${group}', '${toPascalCase(group)}');

3. Add DI tokens in src/core/container/tokens.ts:
     ${Entity}Repository: Symbol.for('${Entity}Repository'),
     ${Entity}Service: Symbol.for('${Entity}Service'),
     ${Entity}Controller: Symbol.for('${Entity}Controller'),

4. Register in src/core/container/register.ts:
     container.registerSingleton(TOKENS.${Entity}Repository, ${Entity}Repository);
     container.registerSingleton(TOKENS.${Entity}Service, ${Entity}Service);
     container.registerSingleton(TOKENS.${Entity}Controller, ${Entity}Controller);
   (then switch the @inject(...) calls in the generated service/controller from string tokens to TOKENS.${Entity}Repository / TOKENS.${Entity}Service)

5. Mount the router in src/modules/index.ts:
     import ${entity}Routes from './${group}/${entitySnake.replace(/_/g, '-')}/${entitySnake}.routes.js';
     router.use('/${group}/${toKebabCase(entityName)}s', ${entity}Routes);

6. Seed permissions for this module (permissions table): ${permissionKey}:read / :create / :update / :delete

7. Run: npm run db:generate && npm run db:migrate
`));
}

main().catch((err) => {
  console.error(chalk.red('Module generation failed:'), err);
  process.exit(1);
});
