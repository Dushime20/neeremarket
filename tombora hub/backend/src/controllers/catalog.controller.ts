import type { Request, Response } from 'express';
import { success } from '../shared/http';
import * as catalogService from '../services/catalog.service';
import {
  productListQuerySchema,
  searchQuerySchema,
} from '../validators/catalog.validator';

export async function listCategories(_req: Request, res: Response) {
  const categories = await catalogService.listCategories();
  return success(res, { categories });
}

export async function getCategory(req: Request, res: Response) {
  const category = await catalogService.getCategoryBySlug(String(req.params.slug));
  return success(res, { category });
}

export async function listProducts(req: Request, res: Response) {
  const query = productListQuerySchema.parse(req.query);
  const data = await catalogService.listProducts(query);
  return success(res, data);
}

export async function getProduct(req: Request, res: Response) {
  const product = await catalogService.getProductBySlug(String(req.params.slug));
  return success(res, { product });
}

export async function search(req: Request, res: Response) {
  const query = searchQuerySchema.parse(req.query);
  const data = await catalogService.listProducts({ ...query, sort: query.sort || 'relevance' });
  return success(res, data);
}
