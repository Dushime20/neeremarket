import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: AuthUser;
    }
  }
}

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
};

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
