import { Router } from 'express';
import * as healthController from '../controllers/health.controller';
import { asyncHandler } from '../shared/middleware';

export const healthRouter = Router();
healthRouter.get('/', asyncHandler(healthController.health));
