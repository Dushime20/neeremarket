import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller';
import * as sellerController from '../controllers/seller.controller';
import { asyncHandler } from '../shared/middleware';

export const catalogRouter = Router();

catalogRouter.get('/categories', asyncHandler(catalogController.listCategories));
catalogRouter.get('/categories/:slug', asyncHandler(catalogController.getCategory));
catalogRouter.get('/products', asyncHandler(catalogController.listProducts));
catalogRouter.get('/products/:slug', asyncHandler(catalogController.getProduct));
catalogRouter.get('/search', asyncHandler(catalogController.search));
catalogRouter.get('/stores', asyncHandler(sellerController.listStores));
catalogRouter.get('/stores/:slug', asyncHandler(sellerController.getStore));
