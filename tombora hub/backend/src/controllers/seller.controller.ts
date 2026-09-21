import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as catalogService from '../services/catalog.service';
import * as sellerService from '../services/seller.service';
import * as reviewService from '../services/review.service';
import * as uploadService from '../services/upload.service';
import {
  adjustInventorySchema,
  createProductSchema,
  productListQuerySchema,
  inventoryListQuerySchema,
  updateProductSchema,
  updateSellerProfileSchema,
  sellerOnboardingSchema,
  sellerReviewsQuerySchema,
} from '../validators/catalog.validator';
import type { ProductStatus } from '@prisma/client';

export async function listStores(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
  const district = req.query.district ? String(req.query.district) : undefined;
  const data = await sellerService.listStores(page, limit, district);
  return success(res, data);
}

export async function getStore(req: Request, res: Response) {
  const store = await sellerService.getStoreBySlug(String(req.params.slug));
  return success(res, { store });
}

export async function getMySeller(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const seller = await catalogService.getSellerProfileByUserId(req.user.id);
  return success(res, {
    seller: {
      ...seller,
      wallet: seller.wallet
        ? {
            pendingBalance: String(seller.wallet.pendingBalance),
            availableBalance: String(seller.wallet.availableBalance),
            currency: seller.wallet.currency,
          }
        : null,
    },
  });
}

export async function updateMySeller(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = updateSellerProfileSchema.parse(req.body);
  const seller = await sellerService.updateMySellerProfile(req.user.id, input);
  return success(res, { seller }, 'Seller profile updated');
}

export async function getSellerDashboard(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const dashboard = await sellerService.getMySellerDashboard(req.user.id);
  return success(res, { dashboard });
}

export async function getOnboarding(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const onboarding = await sellerService.getMyOnboarding(req.user.id);
  return success(res, { onboarding });
}

export async function saveOnboarding(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = sellerOnboardingSchema.parse(req.body);
  const onboarding = await sellerService.saveMyOnboarding(req.user.id, input);
  return success(res, { onboarding }, input.submit ? 'Submitted for review' : 'Onboarding saved');
}

export async function listMyProducts(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const query = productListQuerySchema.parse(req.query);
  const status = req.query.status ? (String(req.query.status) as ProductStatus) : undefined;
  const data = await catalogService.listSellerProducts(req.user.id, { ...query, status });
  return success(res, data);
}

export async function listInventory(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const query = inventoryListQuerySchema.parse(req.query);
  const data = await catalogService.listSellerInventory(req.user.id, query);
  return success(res, data);
}

export async function createProduct(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = createProductSchema.parse(req.body);
  const product = await catalogService.createSellerProduct(req.user.id, input);
  return success(res, { product }, 'Product created', 201);
}

export async function uploadMedia(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const items = uploadService.mapUploadedFiles(files);
  return success(res, { files: items }, 'Upload complete', 201);
}

export async function getProduct(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const product = await catalogService.getSellerProduct(req.user.id, String(req.params.id));
  return success(res, { product });
}

export async function updateProduct(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = updateProductSchema.parse(req.body);
  const product = await catalogService.updateSellerProduct(
    req.user.id,
    String(req.params.id),
    input,
  );
  return success(res, { product }, 'Product updated');
}

export async function deleteProduct(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const result = await catalogService.deleteSellerProduct(req.user.id, String(req.params.id));
  return success(res, result, 'Product deleted');
}

export async function listMyReviews(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const query = sellerReviewsQuerySchema.parse(req.query);
  const data = await reviewService.listSellerReviews(
    req.user.id,
    query.scope,
    query.page,
    query.limit,
  );
  return success(res, data);
}

export async function adjustInventory(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = adjustInventorySchema.parse(req.body);
  const inventory = await catalogService.adjustVariantStock(
    req.user.id,
    String(req.params.variantId),
    input,
  );
  return success(res, { inventory }, 'Inventory updated');
}
