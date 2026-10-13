import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as disputeService from '../services/dispute.service';
import * as uploadService from '../services/upload.service';
import {
  createDisputeSchema,
  disputeMessageSchema,
  disputeNoteSchema,
  listDisputesQuerySchema,
  resolveDisputeSchema,
} from '../validators/dispute.validator';

function clientIp(req: Request) {
  return req.ip || req.socket.remoteAddress;
}

export async function uploadEvidence(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const items = uploadService.mapUploadedFiles(files);
  return success(res, { files: items }, 'Upload complete', 201);
}

export async function createDispute(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = createDisputeSchema.parse(req.body);
  const dispute = await disputeService.createDispute(req.user, input);
  return success(res, { dispute }, 'Dispute opened', 201);
}

export async function listMyDisputes(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const { status } = listDisputesQuerySchema.parse(req.query);
  const data = await disputeService.listCustomerDisputes(req.user.id, status);
  return success(res, data);
}

export async function listSellerDisputes(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const { status } = listDisputesQuerySchema.parse(req.query);
  const data = await disputeService.listSellerDisputes(req.user.id, status);
  return success(res, data);
}

export async function listAdminDisputes(req: Request, res: Response) {
  const { status, q } = listDisputesQuerySchema.parse(req.query);
  const data = await disputeService.listAdminDisputes(status, q);
  return success(res, data);
}

export async function getDispute(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const dispute = await disputeService.getDispute(req.user, String(req.params.id));
  return success(res, { dispute });
}

export async function postMessage(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = disputeMessageSchema.parse(req.body);
  const dispute = await disputeService.postMessage(req.user, String(req.params.id), input);
  return success(res, { dispute }, 'Message sent', 201);
}

export async function withdrawDispute(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const { reason } = disputeNoteSchema.parse(req.body ?? {});
  const dispute = await disputeService.withdrawDispute(req.user, String(req.params.id), reason);
  return success(res, { dispute }, 'Dispute withdrawn');
}

export async function resolveDispute(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = resolveDisputeSchema.parse(req.body);
  const dispute = await disputeService.resolveDispute(
    req.user,
    String(req.params.id),
    input,
    clientIp(req),
  );
  return success(res, { dispute }, 'Dispute resolved');
}
