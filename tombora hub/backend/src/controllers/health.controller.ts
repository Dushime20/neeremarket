import type { Request, Response } from 'express';
import { success } from '../shared/http';
import { prisma } from '../shared/prisma';

export async function health(_req: Request, res: Response) {
  await prisma.$queryRaw`SELECT 1`;
  return success(res, {
    status: 'ok',
    service: 'tombora-hub-api',
    timestamp: new Date().toISOString(),
  });
}
