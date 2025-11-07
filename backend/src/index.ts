import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { env, isProduction } from './config/env';
import { connectDatabase } from './config/database';
import { sessionMiddleware } from './config/session';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

const app = express();

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

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
