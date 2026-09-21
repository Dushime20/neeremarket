import { env } from '../config/env';

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'NeereMarket API',
    version: '0.2.0',
    description: 'Multi-vendor marketplace API for Rwanda (RWF, MoMo-ready)',
  },
  servers: [{ url: env.API_URL + env.API_PREFIX }],
  paths: {
    '/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
    '/auth/register': {
      post: { summary: 'Register customer or seller', responses: { '201': { description: 'Created' } } },
    },
    '/auth/login': {
      post: { summary: 'Login', responses: { '200': { description: 'OK' } } },
    },
    '/auth/google': {
      post: { summary: 'Sign in with Google ID token', responses: { '200': { description: 'OK' } } },
    },
    '/auth/me': {
      get: {
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/categories': {
      get: { summary: 'List categories', responses: { '200': { description: 'OK' } } },
    },
    '/products': {
      get: { summary: 'List products', responses: { '200': { description: 'OK' } } },
    },
    '/products/{slug}': {
      get: { summary: 'Product detail', responses: { '200': { description: 'OK' } } },
    },
    '/search': {
      get: { summary: 'Search products', responses: { '200': { description: 'OK' } } },
    },
    '/stores': {
      get: { summary: 'List stores', responses: { '200': { description: 'OK' } } },
    },
    '/stores/{slug}': {
      get: { summary: 'Storefront', responses: { '200': { description: 'OK' } } },
    },
    '/sellers/me': {
      get: {
        summary: 'Seller profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/sellers/me/products': {
      get: {
        summary: 'Seller products',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        summary: 'Create product',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
};
