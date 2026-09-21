import type { NextFunction, Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { asyncHandler } from '../shared/middleware';
import { loadAuthUser, verifyAccessToken } from '../services/auth.service';

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw Errors.unauthorized();

  const token = header.slice(7);
  const payload = verifyAccessToken(token);
  req.user = await loadAuthUser(payload.sub);
  next();
});

export function requirePermission(...codes: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthorized());
    if (req.user.roles.includes('SUPER_ADMIN')) return next();
    const ok = codes.some((c) => req.user!.permissions.includes(c));
    if (!ok) return next(Errors.forbidden());
    return next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthorized());
    const ok = roles.some((r) => req.user!.roles.includes(r));
    if (!ok) return next(Errors.forbidden());
    return next();
  };
}
