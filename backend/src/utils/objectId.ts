import mongoose from 'mongoose';
import { badRequest } from './httpError';

export const ensureObjectId = (id: string): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw badRequest('Invalid identifier');
  }

  return new mongoose.Types.ObjectId(id);
};
