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

function clientIp(req: Request) {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || undefined;
}

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
    input.destination.phone,
    clientIp(req),
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
    req.user?.id,
    clientIp(req),
  );
  const message = input.action === 'APPROVE' ? 'Payout approved and sent to Mobile Money' : 'Payout cancelled';
  return success(res, { payout }, message);
}

export async function sendPayout(req: Request, res: Response) {
  const payout = await financeService.sendPayout(
    String(req.params.id),
    req.user?.id,
    clientIp(req),
  );
  return success(res, { payout }, 'Payout sent to Mobile Money');
}

export async function checkPayoutStatus(req: Request, res: Response) {
  const payout = await financeService.checkPayoutStatus(String(req.params.id));
  return success(res, { payout });
}

export async function retryRefund(req: Request, res: Response) {
  const result = await returnsService.sendReturnRefund(String(req.params.id));
  return success(res, result, 'Refund sent to Mobile Money');
}

export async function checkRefundStatus(req: Request, res: Response) {
  const result = await returnsService.checkReturnRefund(String(req.params.id));
  return success(res, result);
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
