import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { websocketService } from './services/websocket.service';
import './config/database';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`📍 API base: http://localhost:${PORT}/api`);
});

// Initialize WebSocket
websocketService.initialize(server);
logger.info('✅ WebSocket server initialized');

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
