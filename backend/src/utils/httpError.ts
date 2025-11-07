export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (message = 'Not found'): HttpError => new HttpError(404, message);
export const unauthorized = (message = 'Unauthorized'): HttpError =>
  new HttpError(401, message);
export const forbidden = (message = 'Forbidden'): HttpError => new HttpError(403, message);
export const badRequest = (message = 'Bad request', details?: unknown): HttpError =>
  new HttpError(400, message, details);
