import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env, isProduction } from './env';

export const sessionMiddleware = session({
  name: 'fake_twitter.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: env.mongoUri,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7, // 7 days
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
