import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as authService from '../services/auth.service';
import { googleAuthSchema, loginSchema, refreshSchema, registerSchema } from '../validators/auth.validator';

function meta(req: Request) {
  return { ip: req.ip, userAgent: req.get('user-agent') || undefined };
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const data = await authService.registerUser(input, meta(req));
  return success(res, data, 'Registered successfully', 201);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const data = await authService.loginUser(input, meta(req));
  return success(res, data, 'Logged in successfully');
}

export async function google(req: Request, res: Response) {
  const input = googleAuthSchema.parse(req.body);
  const data = await authService.loginWithGoogle(input, meta(req));
  return success(res, data, 'Logged in successfully');
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  const data = await authService.refreshSession(refreshToken, meta(req));
  return success(res, data, 'Token refreshed');
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  await authService.revokeRefreshToken(refreshToken);
  return success(res, null, 'Logged out');
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  return success(res, { user: req.user });
}
