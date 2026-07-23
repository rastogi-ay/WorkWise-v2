import { startServer, shutdown } from './server.js';

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown().then(() => process.exit(0)));
process.on('SIGINT', () => shutdown().then(() => process.exit(0)));
