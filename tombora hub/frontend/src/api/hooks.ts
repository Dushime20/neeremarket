import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from './client';

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  permissions: string[];
};

type AuthPayload = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

function persistTokens(data: AuthPayload) {
  localStorage.setItem('th_access_token', data.accessToken);
  localStorage.setItem('th_refresh_token', data.refreshToken);
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return null;
      const { data } = await api.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
      return data.data.user;
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email?: string; phone?: string; password: string }) => {
      const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/login', body);
      return data.data;
    },
    onSuccess: (data) => {
      persistTokens(data);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fullName: string;
      email?: string;
      phone?: string;
      password: string;
      role?: 'CUSTOMER' | 'SELLER';
    }) => {
      const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/register', body);
      return data.data;
    },
    onSuccess: (data) => {
      persistTokens(data);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useGoogleAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { idToken: string; role?: 'CUSTOMER' | 'SELLER' }) => {
      const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/google', body);
      return data.data;
    },
    onSuccess: (data) => {
      persistTokens(data);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('th_refresh_token');
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    },
    onSettled: () => {
      localStorage.removeItem('th_access_token');
      localStorage.removeItem('th_refresh_token');
      qc.setQueryData(['auth', 'me'], null);
    },
  });
}

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Category[];
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ categories: Category[] }>>('/categories');
      return data.data.categories;
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ category: Category & { parent?: Category | null } }>>(
        `/categories/${slug}`,
      );
      return data.data.category;
    },
  });
}

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  status?: string;
  ratingAvg: string;
  ratingCount: number;
  images: { url: string }[];
  store: {
    name: string;
    slug: string;
    seller: {
      businessName: string;
      verificationStatus: string;
      district: string | null;
      ratingAvg: string;
    };
  };
  category: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  };
  variants?: Array<{
    id: string;
    sku: string;
    name: string | null;
    attributes: Record<string, string>;
    price?: string | null;
    inventory: {
      quantity: number;
      reserved: number;
      available?: number;
      lowStockThreshold?: number;
    } | null;
  }>;
};

type ProductListResponse = {
  items: ProductListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function useProducts(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductListResponse>>('/products', {
        params,
      });
      return data.data;
    },
  });
}

export function useSearch(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['search', params],
    enabled: !!params.q,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductListResponse>>('/search', { params });
      return data.data;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          product: Omit<ProductListItem, 'variants'> & {
            description: string | null;
            shortDescription: string | null;
            condition?: string;
            weightGrams?: number | null;
            lengthMm?: number | null;
            widthMm?: number | null;
            heightMm?: number | null;
            tags?: string[];
            specifications?: Array<{ name: string; value: string }>;
            videos?: { url: string }[];
            images: { url: string; isPrimary: boolean; altText?: string | null }[];
            variants: {
              id: string;
              sku?: string;
              name: string | null;
              attributes: Record<string, string>;
              price: string | null;
              inventory: { available: number; quantity: number; reserved: number } | null;
            }[];
            store: ProductListItem['store'] & {
              seller: {
                id: string;
                province: string | null;
                ratingCount: number;
                totalOrders: number;
              };
            };
          };
        }>
      >(`/products/${slug}`);
      return data.data.product;
    },
  });
}

export function useStores(page = 1, district?: string) {
  return useQuery({
    queryKey: ['stores', page, district],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: import('@/components/product/SellerCard').StoreListItem[];
          pagination: { page: number; total: number; totalPages: number };
        }>
      >('/stores', { params: { page, district } });
      return data.data;
    },
  });
}

export function useStore(slug: string) {
  return useQuery({
    queryKey: ['store', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          store: import('@/components/product/SellerCard').StoreListItem & {
            products: ProductListItem[];
            seller: {
              description: string | null;
              verificationStatus: string;
              coverUrl: string | null;
            };
          };
        }>
      >(`/stores/${slug}`);
      return data.data.store;
    },
  });
}

export function useSellerDashboard() {
  return useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ dashboard: Record<string, unknown> }>>(
        '/sellers/me/dashboard',
      );
      return data.data.dashboard;
    },
  });
}

export type ProductSpec = { name: string; value: string };

export type SellerProduct = Omit<ProductListItem, 'images'> & {
  status: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string;
  condition?: 'NEW' | 'USED' | 'REFURBISHED';
  weightGrams?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  tags?: string[];
  specifications?: ProductSpec[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  rejectionReason?: string | null;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  videos?: { url: string }[];
};

export function useSellerProducts(status?: string, q?: string) {
  return useQuery({
    queryKey: ['seller', 'products', status, q],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductListResponse>>('/sellers/me/products', {
        params: { status, q },
      });
      return data.data;
    },
  });
}

export function useSellerProduct(productId?: string) {
  return useQuery({
    queryKey: ['seller', 'product', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ product: SellerProduct }>>(
        `/sellers/me/products/${productId}`,
      );
      return data.data.product;
    },
  });
}

export function useUploadMedia() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      const { data } = await api.post<
        ApiSuccess<{
          files: Array<{
            url: string;
            kind: 'image' | 'video';
            originalName: string;
            mimeType: string;
            size: number;
          }>;
        }>
      >('/sellers/me/uploads', form, {
        timeout: 120_000,
        transformRequest: [
          (body, headers) => {
            if (body instanceof FormData) {
              delete headers['Content-Type'];
            }
            return body;
          },
        ],
      });
      return data.data.files;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/sellers/me/products', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/sellers/me/products/${id}`, body);
      return data.data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'product', vars.id] });
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/sellers/me/products/${id}`);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export type SellerReview = {
  id: string;
  rating: number;
  body: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  target: 'product' | 'store';
  customer: { fullName: string; avatarUrl?: string | null };
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  } | null;
};

export function useSellerReviews(scope: 'all' | 'product' | 'store' = 'all') {
  return useQuery({
    queryKey: ['seller', 'reviews', scope],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: SellerReview[];
          summary: { product: number; store: number; total: number };
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >('/sellers/me/reviews', { params: { scope, limit: 50 } });
      return data.data;
    },
  });
}

export type InventoryRow = {
  id: string;
  sku: string;
  name: string | null;
  attributes: Record<string, string>;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isOut: boolean;
  isLow: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
    image: string | null;
  };
};

export function useSellerInventory(stock?: string, q?: string, page = 1) {
  return useQuery({
    queryKey: ['seller', 'inventory', stock, q, page],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: InventoryRow[];
          summary: { variants: number; inStock: number; lowStock: number; outOfStock: number };
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >('/sellers/me/inventory', { params: { stock, q, page, limit: 50 } });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { variantId: string; setQuantity: number; reason?: string }) => {
      const { data } = await api.post(`/sellers/me/inventory/${body.variantId}/adjust`, {
        setQuantity: body.setQuantity,
        reason: body.reason,
      });
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export type CartData = {
  id: string;
  itemCount: number;
  subtotal: string;
  currency: string;
  sellerGroups: {
    sellerId: string;
    storeName: string;
    storeSlug: string;
    subtotal: string;
    items: unknown[];
  }[];
  items: import('@/components/product/CartLineItem').CartLine[];
};

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return null;
      const { data } = await api.get<ApiSuccess<{ cart: CartData }>>('/cart');
      return data.data.cart;
    },
    retry: false,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { variantId: string; quantity: number }) => {
      const { data } = await api.post<ApiSuccess<{ cart: CartData }>>('/cart/items', body);
      return data.data.cart;
    },
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { data } = await api.patch<ApiSuccess<{ cart: CartData }>>(
        `/cart/items/${itemId}`,
        { quantity },
      );
      return data.data.cart;
    },
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.delete<ApiSuccess<{ cart: CartData }>>(
        `/cart/items/${itemId}`,
      );
      return data.data.cart;
    },
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  sector: string | null;
  kgAddress: string | null;
  landmark: string | null;
  isDefault: boolean;
};

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ['addresses'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ addresses: Address[] }>>('/addresses');
      return data.data.addresses;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<ApiSuccess<{ address: Address }>>('/addresses', body);
      return data.data.address;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<
        ApiSuccess<{
          order: { id: string; orderNumber: string; total: string; status: string };
          payment: { id: string; providerRef: string | null; status: string };
        }>
      >('/checkout', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cart'] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: ['orders'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            orderNumber: string;
            status: string;
            total: string;
            createdAt: string;
            sellerOrders?: Array<{ sellerOrderNumber: string; sellerName: string }>;
          }>;
        }>
      >('/orders');
      return data.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ order: Record<string, unknown> }>>(
        `/orders/${id}`,
      );
      return data.data.order;
    },
  });
}

export function useMockPay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/orders/${orderId}/mock-pay`);
      return data.data;
    },
    onSuccess: (_data, orderId) => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['orders', orderId] });
      void qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useSellerFinance() {
  return useQuery({
    queryKey: ['seller', 'finance'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          finance: {
            wallet: { pendingBalance: string; availableBalance: string; currency: string };
            totals: {
              orders: number;
              sales: string;
              commission: string;
              earnings: string;
              withdrawals: string;
            };
            ledger: Array<{
              id: string;
              entryType: string;
              amount: string;
              balanceBucket: string;
              description: string | null;
              createdAt: string;
            }>;
            payouts: Array<{
              id: string;
              amount: string;
              method: string;
              status: string;
              createdAt: string;
            }>;
          };
        }>
      >('/sellers/me/finance');
      return data.data.finance;
    },
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      amount: number;
      method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BANK';
      destination: Record<string, unknown>;
    }) => {
      const { data } = await api.post('/sellers/me/payouts', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'finance'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export function useSellerOrders(status?: string) {
  return useQuery({
    queryKey: ['seller', 'orders', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            sellerOrderNumber: string;
            status: string;
            subtotal: string;
            parentOrderNumber: string;
            items: Array<{ productName: string; quantity: number; lineTotal: string }>;
          }>;
        }>
      >('/sellers/me/orders', { params: { status } });
      return data.data;
    },
  });
}

export function useUpdateSellerOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'DELIVERED';
    }) => {
      const { data } = await api.patch(`/sellers/me/orders/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'finance'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return null;
      const { data } = await api.get<
        ApiSuccess<{
          wishlist: {
            items: Array<{
              id: string;
              variantId: string;
              product: ProductListItem;
              variant: { id: string; name: string | null; available: number };
            }>;
          };
        }>
      >('/wishlist');
      return data.data.wishlist;
    },
    retry: false,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { data } = await api.post('/wishlist/items', { variantId });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { data } = await api.delete(`/wishlist/items/${variantId}`);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            rating: number;
            body: string | null;
            isVerifiedPurchase: boolean;
            helpfulCount: number;
            createdAt: string;
            customer: { fullName: string };
          }>;
        }>
      >(`/products/${productId}/reviews`);
      return data.data;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      productId?: string;
      sellerId?: string;
      rating: number;
      body?: string;
    }) => {
      const { data } = await api.post('/reviews', body);
      return data.data;
    },
    onSuccess: (_d, vars) => {
      if (vars.productId) void qc.invalidateQueries({ queryKey: ['reviews', vars.productId] });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return { items: [], unreadCount: 0 };
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            type: string;
            title: string;
            body: string;
            readAt: string | null;
            createdAt: string;
          }>;
          unreadCount: number;
        }>
      >('/notifications');
      return data.data;
    },
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/read-all');
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMessageThreads(scopeAll = false, enabled = true) {
  return useQuery({
    queryKey: ['messages', 'threads', scopeAll],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            sellerName?: string;
            customerName?: string;
            updatedAt: string;
            lastMessage: { body: string; createdAt: string } | null;
          }>;
        }>
      >('/messages/threads', { params: scopeAll ? { scope: 'all' } : undefined });
      return data.data;
    },
  });
}

export function useThread(threadId: string, scopeAll = false) {
  return useQuery({
    queryKey: ['messages', 'thread', threadId, scopeAll],
    enabled: !!threadId,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          thread: { id: string; sellerId: string; customerId: string; productId: string | null };
          messages: Array<{
            id: string;
            body: string;
            createdAt: string;
            senderId: string;
            sender: { id: string; fullName: string };
          }>;
        }>
      >(`/messages/threads/${threadId}`, { params: scopeAll ? { scope: 'all' } : undefined });
      return data.data;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      threadId?: string;
      sellerId?: string;
      productId?: string;
      body: string;
    }) => {
      const { data } = await api.post('/messages', body);
      return data.data as { threadId: string };
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['messages'] });
      void qc.invalidateQueries({ queryKey: ['messages', 'thread', data.threadId] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          dashboard: {
            counts: {
              users: number;
              sellers: number;
              products: number;
              orders: number;
              pendingSellers: number;
              pendingProducts: number;
              openPayouts: number;
              openReturns: number;
            };
            gmv: string;
            currency: string;
          };
        }>
      >('/admin/dashboard');
      return data.data.dashboard;
    },
  });
}

export function useAdminUsers(q?: string) {
  return useQuery({
    queryKey: ['admin', 'users', q],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            email: string | null;
            phone: string | null;
            fullName: string;
            status: string;
            roles: string[];
          }>;
        }>
      >('/admin/users', { params: { q } });
      return data.data;
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; status: string }) => {
      const { data } = await api.patch(`/admin/users/${body.id}/status`, { status: body.status });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminSellers(status?: string) {
  return useQuery({
    queryKey: ['admin', 'sellers', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            businessName: string;
            verificationStatus: string;
            user: { fullName: string; email: string | null };
            store: { name: string; slug: string } | null;
          }>;
        }>
      >('/admin/sellers', { params: { status } });
      return data.data;
    },
  });
}

export function useModerateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      id: string;
      verificationStatus: string;
      reason?: string;
    }) => {
      const { data } = await api.post(`/admin/sellers/${body.id}/moderate`, {
        verificationStatus: body.verificationStatus,
        reason: body.reason,
      });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sellers'] }),
  });
}

export function useAdminProducts(status?: string) {
  return useQuery({
    queryKey: ['admin', 'products', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            name: string;
            status: string;
            price: string;
            store: { name: string };
          }>;
        }>
      >('/admin/products', { params: { status } });
      return data.data;
    },
  });
}

export function useModerateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; status: string; reason?: string }) => {
      const { data } = await api.post(`/admin/products/${body.id}/moderate`, {
        status: body.status,
        reason: body.reason,
      });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            orderNumber: string;
            status: string;
            total: string;
            customer: { fullName: string };
          }>;
        }>
      >('/admin/orders');
      return data.data;
    },
  });
}

export function useCmsBanners() {
  return useQuery({
    queryKey: ['admin', 'cms', 'banners'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ banners: Array<{ id: string; title: string; isActive: boolean }> }>
      >('/admin/cms/banners');
      return data.data.banners;
    },
  });
}

export function useUpsertBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      imageUrl: string;
      subtitle?: string;
      linkUrl?: string;
      isActive?: boolean;
    }) => {
      const { data } = await api.post('/admin/cms/banners', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] }),
  });
}

export function useCmsPages() {
  return useQuery({
    queryKey: ['admin', 'cms', 'pages'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          pages: Array<{ id: string; slug: string; title: string; isPublished: boolean }>;
        }>
      >('/admin/cms/pages');
      return data.data.pages;
    },
  });
}

export function useUpsertPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      slug: string;
      title: string;
      body: string;
      isPublished?: boolean;
      id?: string;
    }) => {
      const { data } = await api.post('/admin/cms/pages', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] }),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ settings: Array<{ id: string; key: string; value: unknown }> }>
      >('/admin/settings');
      return data.data.settings;
    },
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { key: string; value: unknown }) => {
      const { data } = await api.put('/admin/settings', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}

export function useAdminAudit() {
  return useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            action: string;
            entityType: string;
            entityId: string | null;
            createdAt: string;
            actor: { fullName: string } | null;
          }>;
        }>
      >('/admin/audit-logs');
      return data.data;
    },
  });
}

export type SellerProfile = {
  id: string;
  businessName: string;
  description: string | null;
  businessCategory: string | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  marketLocation: string | null;
  shopLocation: string | null;
  businessPhone: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  verificationStatus: string;
  store: { id: string; name: string; slug: string; description: string | null } | null;
  wallet: { pendingBalance: string; availableBalance: string; currency: string } | null;
};

export function useSellerProfile() {
  return useQuery({
    queryKey: ['seller', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ seller: SellerProfile }>>('/sellers/me');
      return data.data.seller;
    },
  });
}

export function useUpdateSellerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch('/sellers/me', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'me'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'onboarding'] });
    },
  });
}

export type OnboardingStep = {
  id: string;
  title: string;
  hint: string;
  href?: string;
  done: boolean;
};

export type SellerOnboarding = {
  verificationStatus: string;
  businessName: string;
  verification: {
    id: string;
    status: string;
    nationalIdMeta: Record<string, unknown> | null;
    businessRegMeta: Record<string, unknown> | null;
    taxMeta: Record<string, unknown> | null;
    payoutMeta: Record<string, unknown> | null;
    reviewNotes: string | null;
  } | null;
  steps: OnboardingStep[];
  progress: { completed: number; total: number };
  canSubmit: boolean;
};

export function useSellerOnboarding() {
  return useQuery({
    queryKey: ['seller', 'onboarding'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ onboarding: SellerOnboarding }>>(
        '/sellers/me/onboarding',
      );
      return data.data.onboarding;
    },
  });
}

export function useSaveSellerOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      nationalIdMeta?: Record<string, string>;
      businessRegMeta?: Record<string, string>;
      taxMeta?: Record<string, string>;
      payoutMeta?: Record<string, string>;
      submit?: boolean;
    }) => {
      const { data } = await api.post<ApiSuccess<{ onboarding: SellerOnboarding }>>(
        '/sellers/me/onboarding',
        body,
      );
      return data.data.onboarding;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'onboarding'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'me'] });
    },
  });
}

export type ReturnRow = {
  id: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string;
  order: {
    orderNumber: string;
    status: string;
    customer?: { fullName: string; email: string | null };
  };
  items: Array<{ id: string; quantity: number }>;
  refunds: Array<{ id: string; amount: string; status: string }>;
};

export function useSellerReturns() {
  return useQuery({
    queryKey: ['seller', 'returns'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ returns: ReturnRow[] }>>('/sellers/me/returns');
      return data.data.returns;
    },
  });
}

export function useAdminPayouts(status?: string) {
  return useQuery({
    queryKey: ['admin', 'payouts', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          payouts: Array<{
            id: string;
            amount: string;
            method: string;
            status: string;
            createdAt: string;
            seller: { businessName: string; businessPhone: string | null };
          }>;
        }>
      >('/admin/finance/payouts', { params: { status } });
      return data.data.payouts;
    },
  });
}

export function useReviewPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; action: 'APPROVE' | 'CANCEL'; notes?: string }) => {
      const { data } = await api.post(`/admin/finance/payouts/${body.id}/review`, {
        action: body.action,
        notes: body.notes,
      });
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useProcessPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/finance/payouts/${id}/process`);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useAdminReturns() {
  return useQuery({
    queryKey: ['admin', 'returns'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ returns: ReturnRow[] }>>('/admin/finance/returns');
      return data.data.returns;
    },
  });
}

export function useReviewReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; action: 'APPROVE' | 'REJECT'; notes?: string }) => {
      const { data } = await api.post(`/admin/finance/returns/${body.id}/review`, {
        action: body.action,
        notes: body.notes,
      });
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}


