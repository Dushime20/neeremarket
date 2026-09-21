import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as financeService from '../services/finance.service';
import * as returnsService from '../services/returns.service';
import {
  createReturnSchema,
  payoutRequestSchema,
  payoutReviewSchema,
  reviewReturnSchema,
  sellerOrderStatusSchema,
} from '../validators/finance.validator';

export async function getSellerFinance(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const finance = await financeService.getSellerFinance(req.user.id);
  return success(res, { finance });
}

export async function requestPayout(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = payoutRequestSchema.parse(req.body);
  const payout = await financeService.requestPayout(
    req.user.id,
    input.amount,
    input.method,
    input.destination,
  );
  return success(res, { payout }, 'Payout requested', 201);
}

export async function updateSellerOrderStatus(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = sellerOrderStatusSchema.parse(req.body);
  const order = await financeService.updateSellerOrderStatus(
    req.user.id,
    String(req.params.id),
    input.status,
  );
  return success(res, { order }, 'Order status updated');
}

export async function listAdminPayouts(req: Request, res: Response) {
  const status = req.query.status ? String(req.query.status) : undefined;
  const payouts = await financeService.listPayoutsForAdmin(status);
  return success(res, { payouts });
}

export async function reviewPayout(req: Request, res: Response) {
  const input = payoutReviewSchema.parse(req.body);
  const payout = await financeService.reviewPayout(
    String(req.params.id),
    input.action,
    input.notes,
  );
  return success(res, { payout: { ...payout, amount: String(payout.amount) } }, 'Payout reviewed');
}

export async function processPayout(req: Request, res: Response) {
  const payout = await financeService.processPayout(String(req.params.id));
  return success(res, { payout }, 'Payout processed');
}

export async function createReturn(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = createReturnSchema.parse(req.body);
  const ret = await returnsService.requestReturn(
    req.user.id,
    input.orderId,
    input.reason,
    input.notes,
    input.items,
  );
  return success(res, { return: ret }, 'Return requested', 201);
}

export async function listMyReturns(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const returns = await returnsService.listReturns(req.user.id, false);
  return success(res, { returns });
}

export async function listSellerReturns(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const returns = await returnsService.listSellerReturns(req.user.id);
  return success(res, { returns });
}

export async function listAdminReturns(_req: Request, res: Response) {
  const returns = await returnsService.listReturns(undefined, true);
  return success(res, { returns });
}

export async function reviewReturn(req: Request, res: Response) {
  const input = reviewReturnSchema.parse(req.body);
  const result = await returnsService.reviewReturn(
    String(req.params.id),
    input.action,
    input.notes,
  );
  return success(res, result, 'Return reviewed');
}
