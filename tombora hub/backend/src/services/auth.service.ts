import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Errors } from '../shared/errors';
import { prisma } from '../shared/prisma';
import type { AuthUser } from '../shared/middleware';
import type { LoginInput, RegisterInput, GoogleAuthInput } from '../validators/auth.validator';
import { uniqueSlug } from '../shared/serialize';

type TokenPayload = { sub: string; type: 'access' | 'refresh' };
type RequestMeta = { ip?: string; userAgent?: string };

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId, type: 'access' } satisfies TokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign(
    { sub: userId, type: 'refresh' } satisfies TokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions['expiresIn'] },
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  if (payload.type !== 'access') throw Errors.unauthorized('Invalid token type');
  return payload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (payload.type !== 'refresh') throw Errors.unauthorized('Invalid token type');
  return payload;
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function loadAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: 'ACTIVE' },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user) throw Errors.unauthorized();

  const roles = user.roles.map((r) => r.role.code);
  const permissions = [
    ...new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.code))),
  ];

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    roles,
    permissions,
  };
}

function parseDurationMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export async function issueTokenPair(userId: string, meta?: RequestMeta) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_TTL)),
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });

  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function ensureSellerProfile(userId: string, fullName: string) {
  const existing = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (existing) return;
  const storeName = `${fullName}'s Store`;
  const slug = await uniqueSlug(storeName, async (candidate) => {
    const found = await prisma.store.findUnique({ where: { slug: candidate } });
    return !!found;
  });
  await prisma.sellerProfile.create({
    data: {
      userId,
      businessName: storeName,
      store: {
        create: {
          name: storeName,
          slug,
        },
      },
      wallet: { create: {} },
    },
  });
}

type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw Errors.unavailable('Google sign-in is not configured');
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) throw Errors.unauthorized('Google sign-in failed');

  const payload = (await res.json()) as {
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  };

  const issuers = new Set(['accounts.google.com', 'https://accounts.google.com']);
  if (payload.aud !== env.GOOGLE_CLIENT_ID) throw Errors.unauthorized('Google sign-in failed');
  if (!payload.iss || !issuers.has(payload.iss)) throw Errors.unauthorized('Google sign-in failed');
  if (!payload.sub || !payload.email) throw Errors.unauthorized('Google sign-in failed');

  const verified = payload.email_verified === true || payload.email_verified === 'true';
  if (!verified) throw Errors.unauthorized('Google email is not verified');

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: (payload.name || payload.email.split('@')[0]).slice(0, 120),
    picture: payload.picture,
  };
}

export async function registerUser(input: RegisterInput, meta?: RequestMeta) {
  if (input.email) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw Errors.conflict('Email already registered');
  }
  if (input.phone) {
    const exists = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (exists) throw Errors.conflict('Phone already registered');
  }

  const role = await prisma.role.findUnique({ where: { code: input.role } });
  if (!role) throw Errors.notFound('Role');

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      roles: { create: [{ roleId: role.id }] },
    },
  });

  if (input.role === 'SELLER') {
    await ensureSellerProfile(user.id, input.fullName);
  }

  const tokens = await issueTokenPair(user.id, meta);
  const authUser = await loadAuthUser(user.id);
  return { user: authUser, ...tokens };
}

export async function loginUser(input: LoginInput, meta?: RequestMeta) {
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        ...(input.email ? [{ email: input.email }] : []),
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
  });

  if (!user) throw Errors.unauthorized('Invalid credentials');
  if (user.lockedUntil && user.lockedUntil > new Date()) throw Errors.locked();

  const valid = await verifyPassword(user.passwordHash, input.password);

  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      success: valid,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });

  if (!valid) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    throw Errors.unauthorized('Invalid credentials');
  }

  if (user.status !== 'ACTIVE') throw Errors.forbidden('Account is not active');

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  const tokens = await issueTokenPair(user.id, meta);
  const authUser = await loadAuthUser(user.id);
  return { user: authUser, ...tokens };
}

export async function loginWithGoogle(input: GoogleAuthInput, meta?: RequestMeta) {
  const profile = await verifyGoogleIdToken(input.idToken);

  let user =
    (await prisma.user.findFirst({
      where: { deletedAt: null, googleId: profile.sub },
    })) ||
    (await prisma.user.findFirst({
      where: { deletedAt: null, email: { equals: profile.email, mode: 'insensitive' } },
    }));

  if (user) {
    if (user.lockedUntil && user.lockedUntil > new Date()) throw Errors.locked();
    if (user.status !== 'ACTIVE') throw Errors.forbidden('Account is not active');

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || profile.sub,
        email: user.email || profile.email,
        avatarUrl: user.avatarUrl || profile.picture,
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  } else {
    const role = await prisma.role.findUnique({ where: { code: input.role } });
    if (!role) throw Errors.notFound('Role');

    user = await prisma.user.create({
      data: {
        fullName: profile.name,
        email: profile.email,
        googleId: profile.sub,
        avatarUrl: profile.picture,
        emailVerifiedAt: new Date(),
        passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')),
        roles: { create: [{ roleId: role.id }] },
      },
    });

    if (input.role === 'SELLER') {
      await ensureSellerProfile(user.id, profile.name);
    }
  }

  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      success: true,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });

  const tokens = await issueTokenPair(user.id, meta);
  const authUser = await loadAuthUser(user.id);
  return { user: authUser, ...tokens };
}

export async function refreshSession(refreshToken: string, meta?: RequestMeta) {
  const payload = verifyRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashToken(refreshToken),
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) throw Errors.unauthorized('Invalid refresh token');

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(payload.sub, meta);
  const authUser = await loadAuthUser(payload.sub);
  return { user: authUser, ...tokens };
}
