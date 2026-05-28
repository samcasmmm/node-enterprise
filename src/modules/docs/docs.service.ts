import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

import { logger } from '@/shared/utils/devHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate path strings relative to this file to handle any working directory configurations
const apis = [
  path.resolve(__dirname, '../../../../src/modules/**/*.ts').replace(/\\/g, '/'),
  path.resolve(__dirname, '../../../../src/app.ts').replace(/\\/g, '/'),
  path.resolve(__dirname, '../**/*.js').replace(/\\/g, '/'),
];

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Antigravity Enterprise ERP API',
      version: '1.0.0',
      description: 'Auto-generated API documentation with Scalar interactive reference.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis,
};

// Handle potential ESM default wrapper for swagger-jsdoc
const swaggerSpec = typeof swaggerJSDoc === 'function' 
  ? swaggerJSDoc(options) 
  : (swaggerJSDoc as any).default(options);

logger.info('Scalar Docs Initialized');

export function getOpenApiSpec() {
  return swaggerSpec;
}
