import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { serverAdapter } from './config/bull-board';
import { getHealthStatus } from './controllers/health.controller';

import { env } from './config/env';

const app: Express = express();

// Allowed CORS origins
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Global Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Bull Board dashboard assets to load cleanly
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        (env.NODE_ENV === 'development' && origin.startsWith('http://localhost'))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS_BLOCKED: Origin '${origin}' is not allowed by CORS policy.`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bull Board Production Protection Middleware
const bullBoardAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (env.NODE_ENV === 'production') {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-key'];
    const expectedKey = env.BULL_BOARD_AUTH_KEY;

    if (expectedKey && authHeader !== `Bearer ${expectedKey}` && authHeader !== expectedKey) {
      res.status(401).json({
        status: 'error',
        message: 'UNAUTHORIZED_ADMIN_ACCESS: Production Bull Board requires valid admin authorization.',
      });
      return;
    }
  }
  next();
};

// Bull Board Admin Dashboard UI Route
app.use('/admin/queues', bullBoardAuthMiddleware, serverAdapter.getRouter());

// Root & API Health Check Shortcuts
app.get('/health', getHealthStatus);
app.get('/api/health', getHealthStatus);

// API v1 Router
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
