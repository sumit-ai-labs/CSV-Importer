import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { requestIdMiddleware } from './middleware/request-id.js';
import healthRoute from './routes/health.route.js';
import importRoute from './routes/import.route.js';
import { env } from './config/env.js';
import { rateLimit } from 'express-rate-limit';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error.js';

const app = express();

const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many CSV imports from this IP, please try again after 15 minutes',
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many CSV imports from this IP, please try again after 15 minutes',
    },
  },
});

// 1. Security headers
app.use(helmet());

// 2. CORS configurations
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// 3. Compression
app.use(compression());

// 4. JSON body parser
app.use(express.json());

// 5. Custom Request ID generator
app.use(requestIdMiddleware);

// 6. App routes
app.use('/api/v1/health', healthRoute);
app.use('/api/v1/import', importLimiter, importRoute);

// 7. Page not found handler
app.use(notFoundHandler);

// 8. Global error middleware
app.use(errorHandler);

export { app };
export default app;
