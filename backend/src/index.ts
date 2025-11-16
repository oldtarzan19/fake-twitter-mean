import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env';
import { connectDatabase } from './config/database';
import { sessionMiddleware } from './config/session';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { metricsHandler, metricsMiddleware } from './metrics';

const app = express();

// Trust first proxy (nginx reverse proxy)
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(sessionMiddleware);
app.use(metricsMiddleware);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/metrics', metricsHandler);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void start();
