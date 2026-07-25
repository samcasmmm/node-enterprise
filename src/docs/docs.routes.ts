import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Override Content-Security-Policy for docs endpoints to permit Scalar CDN scripts/styles under Helmet security
router.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
  );
  next();
});

function buildOpenApiSpec(): any {
  let baseSpec: any = {};
  const mainYamlPath = path.join(__dirname, 'openapi.yaml');
  if (fs.existsSync(mainYamlPath)) {
    try {
      baseSpec = YAML.parse(fs.readFileSync(mainYamlPath, 'utf8')) ?? {};
    } catch (e) {
      console.error('Error parsing main openapi.yaml:', e);
    }
  }

  if (!baseSpec.openapi) baseSpec.openapi = '3.0.3';
  if (!baseSpec.info) baseSpec.info = { title: 'Node Enterprise ERP API', version: '1.0.0' };
  if (!baseSpec.servers || !baseSpec.servers.length) {
    baseSpec.servers = [
      {
        url: 'http://localhost:3000/api',
        description: 'Local development server',
      },
    ];
  }
  if (!baseSpec.paths) baseSpec.paths = {};
  if (!baseSpec.components) baseSpec.components = {};
  if (!baseSpec.components.securitySchemes) {
    baseSpec.components.securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    };
  }
  if (!baseSpec.tags) baseSpec.tags = [];

  // 1. Scan for module-level YAML files in src/modules/
  const modulesDir = path.join(__dirname, '../modules');
  if (fs.existsSync(modulesDir)) {
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.docs.yaml') ||
            entry.name.endsWith('.docs.yml') ||
            entry.name.endsWith('.openapi.yaml') ||
            entry.name.endsWith('.openapi.yml') ||
            entry.name.endsWith('.yaml') ||
            entry.name.endsWith('.yml'))
        ) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const modSpec = YAML.parse(content);
            if (modSpec && typeof modSpec === 'object') {
              if (modSpec.paths) baseSpec.paths = { ...baseSpec.paths, ...modSpec.paths };
              if (modSpec.components) {
                baseSpec.components.schemas = {
                  ...baseSpec.components.schemas,
                  ...modSpec.components?.schemas,
                };
                baseSpec.components.securitySchemes = {
                  ...baseSpec.components.securitySchemes,
                  ...modSpec.components?.securitySchemes,
                };
                baseSpec.components.parameters = {
                  ...baseSpec.components.parameters,
                  ...modSpec.components?.parameters,
                };
                baseSpec.components.responses = {
                  ...baseSpec.components.responses,
                  ...modSpec.components?.responses,
                };
              }
              if (modSpec.tags && Array.isArray(modSpec.tags)) {
                baseSpec.tags = [...baseSpec.tags, ...modSpec.tags];
              }
            }
          } catch (e) {
            console.error(`Error parsing module YAML at ${fullPath}:`, e);
          }
        }
      }
    };
    scanDir(modulesDir);
  }

  return baseSpec;
}

router.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(buildOpenApiSpec());
});

router.get('/openapi.yaml', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(buildOpenApiSpec());
});

router.use('/', (req, res, next) => {
  const handler = apiReference({
    spec: {
      content: buildOpenApiSpec(),
    },
  }) as any;
  return handler(req, res, next);
});

export default router;
