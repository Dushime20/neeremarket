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
    isActive?: boolean;
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
            categories?: Array<{
              id: string;
              name: string;
              slug: string;
              children?: Array<{ id: string; name: string; slug: string }>;
            }>;
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
  isActive: boolean;
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
          summary: { variants: number; inStock: number; lowStock: number; outOfStock: number; notOffered: number };
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
    mutationFn: async (body: {
      variantId: string;
      setQuantity?: number;
      isAvailable?: boolean;
      reason?: string;
    }) => {
      const { data } = await api.post(`/sellers/me/inventory/${body.variantId}/adjust`, {
        setQuantity: body.setQuantity,
        isAvailable: body.isAvailable,
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
          payment: {
            id: string;
            providerRef: string | null;
            status: string;
            method?: string;
            amount?: string;
            instructions?: {
              title?: string;
              message?: string;
              network?: string;
              phone?: string;
            } | null;
          };
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

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post<
        ApiSuccess<{
          payment: {
            id: string;
            status: string;
            providerRef: string | null;
            amount: string;
            method: string;
            instructions?: {
              title?: string;
              message?: string;
              network?: string;
              phone?: string;
            } | null;
            failureReason?: string | null;
          };
          order: { id: string; status: string };
        }>
      >(`/payments/${paymentId}/verify`);
      return data.data;
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['orders', result.order.id] });
      void qc.invalidateQueries({ queryKey: ['cart'] });
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

export function useConfirmDelivery(scope: 'customer' | 'admin' = 'customer') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, sellerOrderId }: { orderId: string; sellerOrderId: string }) => {
      const base = scope === 'admin' ? '/admin/orders' : '/orders';
      const { data } = await api.post(
        `${base}/${orderId}/seller-orders/${sellerOrderId}/confirm-delivery`,
      );
      return data.data;
    },
    onSuccess: (_data, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['orders', orderId] });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
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
    mutationFn: async (body: { amount: number; destination: { phone: string } }) => {
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
      status: 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'OUT_FOR_DELIVERY';
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
            sellerId: string;
            sellerName?: string;
            sellerLogoUrl: string | null;
            customerName?: string;
            updatedAt: string;
            lastMessage: { body: string; createdAt: string; senderId: string } | null;
            unreadCount: number;
          }>;
        }>
      >('/messages/threads', { params: scopeAll ? { scope: 'all' } : undefined });
      return data.data;
    },
  });
}

export type MessageableSeller = {
  sellerId: string;
  storeName: string;
  storeSlug: string;
  businessName: string;
  logoUrl: string | null;
  verified: boolean;
  location: string | null;
  threadId: string | null;
};

export function useMessageableSellers(q = '', enabled = true) {
  return useQuery({
    queryKey: ['messages', 'sellers', q],
    enabled,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: MessageableSeller[] }>>(
        '/messages/sellers',
        { params: q ? { q } : undefined },
      );
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
              openDisputes: number;
              escalatedDisputes: number;
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

export type AdminUserDetail = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  status: string;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  sellerProfile?: {
    id: string;
    businessName: string;
    verificationStatus: string;
    store: { id: string; name: string; slug: string } | null;
  } | null;
  addresses?: Array<{
    id: string;
    fullName?: string;
    recipientName?: string;
    phone: string;
    province: string;
    district: string;
    sector?: string | null;
    street?: string | null;
    streetAddress?: string | null;
    isDefault: boolean;
  }>;
  loginHistory?: Array<{
    id: string;
    ip?: string | null;
    userAgent?: string | null;
    success: boolean;
    createdAt: string;
  }>;
  _count?: {
    orders: number;
    reviews: number;
    disputes: number;
  };
};

export function useAdminUser(userId?: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ user: AdminUserDetail }>>(`/admin/users/${userId}`);
      return data.data.user;
    },
  });
}

export type AdminSellerDetail = {
  id: string;
  userId: string;
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
  ratingAvg: string | number;
  ratingCount: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    createdAt: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    headline: string | null;
    description: string | null;
  } | null;
  wallet?: {
    availableBalance: string;
    pendingBalance: string;
    currency: string;
  } | null;
  verifications?: Array<{
    id: string;
    status: string;
    nationalIdMeta: unknown;
    businessRegMeta: unknown;
    taxMeta: unknown;
    payoutMeta: unknown;
    reviewNotes: string | null;
    createdAt: string;
  }>;
  _count?: {
    sellerOrders: number;
    reviews: number;
    payoutRequests: number;
    disputes: number;
  };
};

export function useAdminSeller(sellerId?: string) {
  return useQuery({
    queryKey: ['admin', 'seller', sellerId],
    enabled: !!sellerId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ seller: AdminSellerDetail }>>(`/admin/sellers/${sellerId}`);
      return data.data.seller;
    },
  });
}

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  description: string | null;
  shortDescription: string | null;
  condition: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string } | null;
  store: {
    id: string;
    name: string;
    slug: string;
    seller: { id: string; businessName: string; verificationStatus: string };
  };
  images: Array<{ id: string; url: string; altText: string | null; isPrimary: boolean }>;
  videos: Array<{ id: string; url: string }>;
  specifications: Array<{ id: string; name: string; value: string }>;
  variants: Array<{
    id: string;
    name: string | null;
    sku: string | null;
    price: string | null;
    attributes: Record<string, string>;
    inventory?: { available: number; quantity: number; reserved: number } | null;
  }>;
};

export function useAdminProduct(productId?: string) {
  return useQuery({
    queryKey: ['admin', 'product', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ product: AdminProductDetail }>>(`/admin/products/${productId}`);
      return data.data.product;
    },
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

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  deliveryFee: string;
  discountTotal: string;
  platformCharges: string;
  total: string;
  createdAt: string;
  paidAt: string | null;
  notes: string | null;
  couponCode: string | null;
  customer: { id: string; fullName: string; email: string | null; phone: string | null };
  address: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    sector?: string | null;
    cell?: string | null;
    village?: string | null;
    street?: string | null;
    landmark?: string | null;
    instructions?: string | null;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    method: string;
    provider: string;
    amount: string;
    providerRef: string | null;
  }>;
  sellerOrders: Array<{
    id: string;
    sellerOrderNumber: string;
    sellerName: string;
    status: string;
    subtotal: string;
    deliveryFee: string;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }>;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
};

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ order: AdminOrderDetail }>>(`/admin/orders/${id}`);
      return data.data.order;
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

export type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  ip?: string | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
};

export type AuditStats = {
  totalAuditLogs: number;
  auditLogsPast24h: number;
  totalLogins: number;
  failedLoginsPast24h: number;
  successfulLoginsPast24h: number;
  payoutAuditsCount: number;
};

export type LoginHistoryItem = {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    avatarUrl: string | null;
  };
};

export function useAdminAudit(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.action) sp.set('action', params.action);
      if (params?.entityType) sp.set('entityType', params.entityType);
      if (params?.search) sp.set('search', params.search);
      const query = sp.toString() ? `?${sp.toString()}` : '';

      const { data } = await api.get<
        ApiSuccess<{
          items: AuditLogItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >(`/admin/audit-logs${query}`);
      return data.data;
    },
  });
}

export function useAdminAuditStats() {
  return useQuery({
    queryKey: ['admin', 'audit', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ stats: AuditStats }>>('/admin/audit-logs/stats');
      return data.data.stats;
    },
  });
}

export function useAdminLoginHistory(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  success?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'login-history', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.userId) sp.set('userId', params.userId);
      if (params?.success !== undefined) sp.set('success', String(params.success));
      if (params?.search) sp.set('search', params.search);
      const query = sp.toString() ? `?${sp.toString()}` : '';

      const { data } = await api.get<
        ApiSuccess<{
          items: LoginHistoryItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >(`/admin/login-history${query}`);
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
            reviewNotes: string | null;
            destination: { phone?: string } | null;
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
    // Approval can succeed even when the MoMo transfer errors, so refresh either way.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function usePayoutAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'send' | 'check' }) => {
      const { data } = await api.post<ApiSuccess<{ payout: { status: string } }>>(
        `/admin/finance/payouts/${id}/${action}`,
      );
      return data.data.payout;
    },
    onSettled: () => {
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
    // Approval can succeed even when the MoMo refund errors, so refresh either way.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useRefundAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ returnId, action }: { returnId: string; action: 'send' | 'check' }) => {
      const { data } = await api.post<ApiSuccess<{ refund: { status: string } }>>(
        `/admin/finance/returns/${returnId}/refund/${action}`,
      );
      return data.data.refund;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
    },
  });
}

export type DisputeType =
  | 'SHIPPING_DELAY'
  | 'NOT_DELIVERED'
  | 'DAMAGED_ITEM'
  | 'WRONG_ITEM'
  | 'MISSING_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'PAYMENT_ISSUE'
  | 'SELLER_UNRESPONSIVE'
  | 'OTHER';

export type DisputeStatus =
  | 'OPEN'
  | 'SELLER_RESPONDED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type DisputeResolution =
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'REPLACEMENT'
  | 'REDELIVERY'
  | 'RETURN_AND_REFUND'
  | 'NO_ACTION'
  | 'OTHER';

export type DisputeParty = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SYSTEM';

export type DisputeSummary = {
  id: string;
  disputeNumber: string;
  type: DisputeType;
  status: DisputeStatus;
  subject: string;
  resolution: DisputeResolution | null;
  createdAt: string;
  updatedAt: string;
  escalatedAt: string | null;
  orderId: string;
  orderNumber: string;
  sellerOrderNumber: string;
  sellerName: string;
  customerName: string;
  messageCount: number;
  lastMessage: { body: string; authorRole: DisputeParty; createdAt: string } | null;
};

export type DisputeDetail = {
  id: string;
  disputeNumber: string;
  type: DisputeType;
  status: DisputeStatus;
  subject: string;
  description: string;
  desiredOutcome: DisputeResolution | null;
  evidenceUrls: string[];
  resolution: DisputeResolution | null;
  resolutionNote: string | null;
  refundAmount: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedBy: { id: string; fullName: string } | null;
  order: { id: string; orderNumber: string; status: string; total: string; createdAt: string };
  sellerOrder: {
    id: string;
    sellerOrderNumber: string;
    status: string;
    subtotal: string;
    deliveryFee: string;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      quantity: number;
      lineTotal: string;
    }>;
  };
  customer: { id: string; fullName: string; email?: string | null; phone?: string | null };
  seller: { id: string; businessName: string; businessPhone: string | null };
  messages: Array<{
    id: string;
    authorRole: DisputeParty;
    authorName: string | null;
    body: string;
    attachments: string[];
    createdAt: string;
    mine: boolean;
  }>;
  viewer: {
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    canReply: boolean;
    canWithdraw: boolean;
    canResolve: boolean;
  };
};

function invalidateDisputes(qc: ReturnType<typeof useQueryClient>, dispute?: DisputeDetail) {
  void qc.invalidateQueries({ queryKey: ['disputes'] });
  void qc.invalidateQueries({ queryKey: ['seller', 'disputes'] });
  void qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
  void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  if (dispute) qc.setQueryData(['disputes', 'detail', dispute.id], dispute);
}

export function useMyDisputes(status?: DisputeStatus, enabled = true) {
  return useQuery({
    queryKey: ['disputes', 'mine', status],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: DisputeSummary[] }>>('/disputes/me', {
        params: { status },
      });
      return data.data.items;
    },
  });
}

export function useSellerDisputes(status?: DisputeStatus) {
  return useQuery({
    queryKey: ['seller', 'disputes', status],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: DisputeSummary[] }>>(
        '/sellers/me/disputes',
        { params: { status } },
      );
      return data.data.items;
    },
  });
}

export function useAdminDisputes(status?: DisputeStatus, q?: string) {
  return useQuery({
    queryKey: ['admin', 'disputes', status, q],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ items: DisputeSummary[]; counts: Partial<Record<DisputeStatus, number>> }>
      >('/admin/disputes', { params: { status, q: q || undefined } });
      return data.data;
    },
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: ['disputes', 'detail', id],
    enabled: !!id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ dispute: DisputeDetail }>>(`/disputes/${id}`);
      return data.data.dispute;
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      orderId: string;
      sellerOrderId: string;
      type: DisputeType;
      subject: string;
      description: string;
      desiredOutcome?: DisputeResolution;
      evidenceUrls?: string[];
    }) => {
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>('/disputes', body);
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}

export function useUploadDisputeEvidence() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      const { data } = await api.post<
        ApiSuccess<{ files: Array<{ url: string; kind: 'image' | 'video'; originalName: string }> }>
      >('/disputes/uploads', form, { timeout: 120_000 });
      return data.data.files;
    },
  });
}

export function usePostDisputeMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; body: string; attachments?: string[] }) => {
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>(
        `/disputes/${body.id}/messages`,
        { body: body.body, attachments: body.attachments },
      );
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}

export function useWithdrawDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; reason?: string }) => {
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>(
        `/disputes/${body.id}/withdraw`,
        { reason: body.reason },
      );
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      id: string;
      outcome: 'RESOLVED' | 'REJECTED';
      resolution: DisputeResolution;
      note: string;
      refundAmount?: number;
    }) => {
      const { id, ...rest } = body;
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>(
        `/admin/disputes/${id}/resolve`,
        rest,
      );
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}


