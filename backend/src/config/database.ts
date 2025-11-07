import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  mongoose.set('strictQuery', true);
  return mongoose.connect(env.mongoUri);
};
