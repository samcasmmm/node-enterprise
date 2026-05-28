import dotenv from 'dotenv';
import path from 'path';

// 1. CRITICAL: Load environment variables before ANY other internal imports
dotenv.config({
  path: path.resolve(process.cwd(), 'env/.env.prod'),
});

import http from 'http';
import app from './app.js';
import { tenantCache } from './shared/cache/db-cache.js';
import { logger } from './shared/utils/devHelper.js';
import { db } from './config/db.config.js';

// Fallback logic using configuration safely loaded from your environment
const PORT = Number(process.env.PORT) || 3100;
let isShuttingDown = false;

function bootstrap() {
  const server = http.createServer(app);

  server.listen(PORT);

  server.on('listening', () => {
    logger.banner(`Server Running: http://localhost:${PORT}`);
    logger.banner(`Scalar Docs : http://localhost:${PORT}/api/docs`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error('Port already in use', { port: PORT });
    } else {
      logger.error('Server startup error', error);
    }
    process.exit(1);
  });

  process.on('SIGINT', () => shutdown(server, 'SIGINT'));
  process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
    shutdown(server, 'unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown(server, 'uncaughtException');
  });
}


async function shutdown(server: http.Server, signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`\n🛑 Received ${signal}. Initializing graceful shutdown...`);

  const timeout = setTimeout(() => {
    logger.error('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
  timeout.unref();

  // 1. Stop accepting new HTTP requests and finish active ones
  server.close(async (err) => {
    clearTimeout(timeout);

    if (err) {
      logger.error('Error during HTTP server shutdown', err);
    } else {
      logger.info('Express HTTP server closed.');
    }

    try {
      logger.info('Cleaning up cached tenant database pools...');
      await tenantCache.closeAll();
      logger.info('All active tenant connection pools terminated.');

      logger.info('Closing primary database directory pool...');
      if (db.$client && typeof db.$client.end === 'function') {
        await db.$client.end();
      }

      logger.info('Primary database connection pool terminated.');


      logger.info('Goodbye!');
      process.exit(0);
    } catch (shutdownError) {
      logger.error('Error while closing database resources:', shutdownError);
      process.exit(1);
    }
  });
}

bootstrap();  