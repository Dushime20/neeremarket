import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as cartService from '../services/cart.service';
import * as addressService from '../services/address.service';
import * as checkoutService from '../services/checkout.service';
import {
  addCartItemSchema,
  checkoutSchema,
  createAddressSchema,
  paymentWebhookSchema,
  updateCartItemSchema,
} from '../validators/commerce.validator';

export async function getCart(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const cart = await cartService.getCart(req.user.id);
  return success(res, { cart });
}

export async function addCartItem(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = addCartItemSchema.parse(req.body);
  const cart = await cartService.addCartItem(req.user.id, input.variantId, input.quantity);
  return success(res, { cart }, 'Added to cart');
}

export async function updateCartItem(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = updateCartItemSchema.parse(req.body);
  const cart = await cartService.updateCartItem(req.user.id, String(req.params.itemId), input.quantity);
  return success(res, { cart }, 'Cart updated');
}

export async function removeCartItem(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const cart = await cartService.removeCartItem(req.user.id, String(req.params.itemId));
  return success(res, { cart }, 'Item removed');
}

export async function listAddresses(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const addresses = await addressService.listAddresses(req.user.id);
  return success(res, { addresses });
}

export async function createAddress(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = createAddressSchema.parse(req.body);
  const address = await addressService.createAddress(req.user.id, input);
  return success(res, { address }, 'Address saved', 201);
}

export async function checkout(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = checkoutSchema.parse(req.body);
  const data = await checkoutService.checkout(req.user.id, input);
  return success(res, data, 'Checkout created', 201);
}

export async function listOrders(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const page = Math.max(1, Number(req.query.page) || 1);
  const data = await checkoutService.listCustomerOrders(req.user.id, page);
  return success(res, data);
}

export async function getOrder(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const order = await checkoutService.getCustomerOrder(req.user.id, String(req.params.id));
  return success(res, { order });
}

export async function mockPay(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const result = await checkoutService.mockPayOrder(req.user.id, String(req.params.id));
  return success(res, result, 'Payment confirmed');
}

export async function paymentWebhook(req: Request, res: Response) {
  const provider = String(req.params.provider || 'mock');
  paymentWebhookSchema.parse(req.body);
  const result = await checkoutService.confirmPaymentFromWebhook(provider, req.headers, req.body);
  return success(res, result, 'Webhook processed');
}

export async function listSellerOrders(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const status = req.query.status ? String(req.query.status) : undefined;
  const data = await checkoutService.listSellerOrders(req.user.id, status);
  return success(res, data);
}
