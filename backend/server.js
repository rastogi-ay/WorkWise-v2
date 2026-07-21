import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import analyticsController from './controllers/analyticsController.js';
import usersController from './controllers/usersController.js';
import environmentsController from './controllers/environmentsController.js';
import campaignsController from './controllers/campaignsController.js';
import creditsController from './controllers/creditsController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
let server;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite default port
      'http://localhost:3000', // Alternative React port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  }),
);
app.use(clerkMiddleware());
app.use(express.json());

// Controllers
app.use('/api/users', usersController);
app.use('/api/environments', environmentsController);
app.use('/api/analytics', analyticsController);
app.use('/api/campaigns', campaignsController);
app.use('/api/credits', creditsController);

// Start the server, wait for MongoDB to connect
export async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.connection.on('error', (err) =>
    console.error('MongoDB connection error:', err),
  );
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('MongoDB connected');
  });

  return server;
}

// Shutdown the server, close MongoDB connection
export async function shutdown() {
  if (!server) return;

  return new Promise((resolve) => {
    server.close(async () => {
      await mongoose.disconnect();
      console.log('Server closed. MongoDB disconnected');
      resolve();
    });
  });
}
