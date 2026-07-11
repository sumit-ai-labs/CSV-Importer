import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

// Start Express HTTP server
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

/**
 * Handles graceful shutdown by closing the server and exiting the process.
 */
const gracefulShutdown = (signal: string, exitCode = 0): void => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(exitCode);
  });

  // Force shutdown after 10s if connections refuse to close
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcefully exiting.');
    process.exit(1);
  }, 10000);
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

// Handle unexpected process-level errors
process.on('uncaughtException', (error: Error) => {
  logger.fatal(error, 'Uncaught Exception detected');
  gracefulShutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.fatal(error, 'Unhandled Rejection detected');
  gracefulShutdown('unhandledRejection', 1);
});
