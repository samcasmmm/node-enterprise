import http from 'http';
import app from './app.js';
import appConfig from './config/app.config.js';
import { logger } from './shared/logger/index.js';
import { db } from './config/db.config.js';

export class Server {
  private readonly port: number;
  private readonly server: http.Server;
  private isShuttingDown = false;

  constructor() {
    this.port = appConfig.port;
    this.server = http.createServer(app);

    this.registerServerEvents();
    this.registerProcessEvents();
  }

  public start(): void {
    this.server.listen(this.port);
  }

  private registerServerEvents(): void {
    this.server.on('listening', this.onListening);
    this.server.on('error', this.onError);
  }

  private registerProcessEvents(): void {
    process.once('SIGINT', () => this.shutdown('SIGINT'));
    process.once('SIGTERM', () => this.shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', { reason });
      this.shutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      this.shutdown('uncaughtException');
    });
  }

  private onListening = (): void => {
    logger.banner(`Server Running : http://localhost:${this.port}`);
    logger.banner(`Scalar Docs   : http://localhost:${this.port}/api/docs`);
  };

  private onError = (error: NodeJS.ErrnoException): void => {
    switch (error.code) {
      case 'EADDRINUSE':
        logger.error('Port already in use.', { port: this.port });
        break;

      case 'EACCES':
        logger.error('Port requires elevated privileges.', {
          port: this.port,
        });
        break;

      default:
        logger.error('Server startup error.', error);
    }

    process.exit(1);
  };

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.warn(`🛑 ${signal} received. Starting graceful shutdown...`);

    const timeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out. Force exiting.');
      process.exit(1);
    }, 10000);

    timeout.unref();

    this.server.close(async (err) => {
      clearTimeout(timeout);

      if (err) {
        logger.error('Error closing HTTP server.', err);
      } else {
        logger.info('HTTP server closed.');
      }

      try {
        await this.closeDatabase();

        logger.success('Graceful shutdown completed.');
        process.exit(0);
      } catch (error) {
        logger.error('Shutdown failed.', error);
        process.exit(1);
      }
    });
  }

  private async closeDatabase(): Promise<void> {
    logger.info('Closing database connection pool...');

    if (db.$client && typeof db.$client.end === 'function') {
      await db.$client.end();
    }

    logger.info('Database connection pool closed.');
  }
}

// Start the server
const server = new Server();
server.start();
