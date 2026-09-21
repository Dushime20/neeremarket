export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE_ADMIN',
  'SELLER_ADMIN',
  'ORDER_ADMIN',
  'CONTENT_ADMIN',
  'CUSTOMER_SUPPORT',
] as const;

export function isAdminRole(roles: string[] | undefined | null) {
  return !!roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
}

export function isSellerRole(roles: string[] | undefined | null) {
  return !!roles?.some((role) => role === 'SELLER' || role === 'SUPER_ADMIN' || role === 'ADMIN');
}

/** Marketplace seller account — used for header/footer, not staff impersonation. */
export function hasSellerAccount(roles: string[] | undefined | null) {
  return !!roles?.includes('SELLER');
}

/** Default workspace after sign-in: admin → seller → customer account. */
export function dashboardHome(roles: string[] | undefined | null) {
  if (isAdminRole(roles)) return '/admin';
  if (isSellerRole(roles)) return '/seller';
  return '/account';
}

export function safeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
  } catch {
    return fallback;
  }
  return fallback;
}

export function postLoginPath(roles: string[] | undefined | null, next?: string | null) {
  const home = dashboardHome(roles);
  const candidate = safeInternalPath(next, home);
  if (candidate.startsWith('/login') || candidate.startsWith('/register')) return home;
  if (candidate.startsWith('/admin') && !isAdminRole(roles)) return home;
  if (candidate.startsWith('/seller') && !isSellerRole(roles)) return home;
  return candidate;
}

export function loginHref(next?: string | null) {
  const path = safeInternalPath(next, '');
  if (!path || path.startsWith('/login') || path.startsWith('/register')) return '/login';
  return `/login?next=${encodeURIComponent(path)}`;
}

export function accountDisplayName(user?: {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
} | null) {
  const name = user?.fullName?.trim();
  if (name) return name;
  if (user?.email) return user.email.split('@')[0];
  if (user?.phone) return user.phone;
  return 'there';
}
