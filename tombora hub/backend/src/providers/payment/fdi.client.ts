import { createHash } from 'node:crypto';
import { env } from '../../config/env';

const CHANNEL_MTN = 'momo-mtn-rw';
const CHANNEL_AIRTEL = 'momo-airtel-rw';

type Json = Record<string, unknown>;

let cachedToken: string | null = null;
let cachedTokenExp = 0;

function cleanSecret(value: string) {
  let raw = value.trim();
  if (raw.toLowerCase().startsWith('secret:')) raw = raw.slice(7).trim();
  if (raw.startsWith(':')) raw = raw.slice(1).trim();
  return raw;
}

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export function fdiConfigured() {
  return Boolean(env.FDI_APP_ID && env.FDI_APP_SECRET && env.FDI_COLLECTION_ACCOUNT_ID && env.FDI_BASE_URL);
}

export function fdiApiUrl(path: string) {
  let root = normalizeBaseUrl(env.FDI_BASE_URL);
  if (!root.endsWith('/v2')) root = `${root}/v2`;
  return `${root}${path.startsWith('/') ? path : `/${path}`}`;
}

export function fdiWebhookUrl() {
  const base = env.FDI_CALLBACK_BASE_URL.replace(/\/+$/, '');
  if (!base) return '';
  const host = base.toLowerCase();
  if (
    host.includes('localhost') ||
    host.startsWith('http://127.') ||
    host.startsWith('http://0.0.0.0')
  ) {
    return '';
  }
  return `${base}${env.API_PREFIX}/payments/fdi/webhook`;
}

export function normalizeMsisdn(msisdn?: string | null) {
  const digits = String(msisdn || '').replace(/\D/g, '');
  if (digits.startsWith('250') && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith('0') && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9) return `250${digits}`;
  return digits;
}

export function isValidRwandaMsisdn(msisdn?: string | null) {
  let digits = String(msisdn || '').replace(/\D/g, '');
  if (digits.startsWith('250')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 9 && digits.startsWith('7');
}

export function inferChannel(msisdn?: string | null, method?: string) {
  if (method === 'MTN_MOMO') return CHANNEL_MTN;
  if (method === 'AIRTEL_MONEY') return CHANNEL_AIRTEL;
  let digits = String(msisdn || '').replace(/\D/g, '');
  if (digits.startsWith('250')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  const prefix = digits.slice(0, 2);
  if (prefix === '78' || prefix === '79') return CHANNEL_MTN;
  if (prefix === '72' || prefix === '73') return CHANNEL_AIRTEL;
  return env.FDI_DEFAULT_CHANNEL || CHANNEL_MTN;
}

export function wholeRwf(amount: number) {
  return Math.max(0, Math.round(Number(amount) || 0));
}

function jwtExp(token: string) {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = JSON.parse(Buffer.from(padded, 'base64url').toString('utf8')) as { exp?: number };
    return Number(json.exp || 0);
  } catch {
    return Math.floor(Date.now() / 1000) + 3300;
  }
}

async function authenticate(force = false) {
  const now = Date.now() / 1000;
  if (!force && cachedToken && now < cachedTokenExp - 60) return cachedToken;

  const res = await fetch(fdiApiUrl('/auth'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      appId: env.FDI_APP_ID,
      secret: cleanSecret(env.FDI_APP_SECRET),
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Json;
  const token = ((body.data as Json | undefined)?.token as string | undefined) || '';
  if (!res.ok || !token) {
    throw new Error('Could not authenticate with FDI Payments');
  }
  cachedToken = token;
  cachedTokenExp = jwtExp(token) || now + 3300;
  return token;
}

async function fdiRequest(
  method: string,
  path: string,
  opts?: { json?: Json; idempotencyKey?: string; retryAuth?: boolean },
): Promise<{ status: number; body: Json }> {
  const token = await authenticate();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  const res = await fetch(fdiApiUrl(path), {
    method,
    headers,
    body: opts?.json ? JSON.stringify(opts.json) : undefined,
  });

  if (res.status === 401 && opts?.retryAuth !== false) {
    await authenticate(true);
    return fdiRequest(method, path, { ...opts, retryAuth: false });
  }

  const body = (await res.json().catch(() => ({}))) as Json;
  return { status: res.status, body: typeof body === 'object' && body ? body : {} };
}

function errorMessage(body: Json, fallback: string) {
  const data = body.data && typeof body.data === 'object' ? (body.data as Json) : {};
  return String(data.message || body.message || fallback);
}

export type FdiPullResult = {
  trxRef: string;
  gwRef: string | null;
  state: string;
  channelId: string;
  msisdn: string;
  stub: boolean;
};

export async function fdiMomoPull(input: {
  trxRef: string;
  msisdn: string;
  amount: number;
  method?: string;
}): Promise<FdiPullResult> {
  if (!isValidRwandaMsisdn(input.msisdn)) {
    throw new Error('Enter a valid Rwanda MoMo number (MTN 078/079 or Airtel 072/073)');
  }
  const amount = wholeRwf(input.amount);
  if (amount < 100) throw new Error('Mobile money payments must be at least 100 RWF');

  const channelId = inferChannel(input.msisdn, input.method);
  const msisdn = normalizeMsisdn(input.msisdn);

  if (!fdiConfigured()) {
    return {
      trxRef: input.trxRef,
      gwRef: `STUB-${input.trxRef}`,
      state: 'processing',
      channelId,
      msisdn,
      stub: true,
    };
  }

  const payload: Json = {
    trxRef: input.trxRef,
    channelId,
    accountId: env.FDI_COLLECTION_ACCOUNT_ID,
    msisdn,
    amount,
  };
  const callback = fdiWebhookUrl();
  if (callback) payload.callback = callback;

  const { status, body } = await fdiRequest('POST', '/momo/pull', {
    json: payload,
    idempotencyKey: input.trxRef,
  });

  if ((status === 200 || status === 202) && body.status === 'success') {
    const data = (body.data as Json) || {};
    return {
      trxRef: input.trxRef,
      gwRef: String(data.gwRef || data.id || '') || null,
      state: String(data.state || 'processing'),
      channelId,
      msisdn,
      stub: false,
    };
  }

  throw new Error(errorMessage(body, `FDI collection failed (HTTP ${status})`));
}

export type FdiTrxStatus = 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'UNKNOWN';

export async function fdiGetTransaction(ref: string): Promise<{
  status: FdiTrxStatus;
  reason?: string;
  details?: Json;
}> {
  if (!ref) return { status: 'UNKNOWN', reason: 'Missing transaction reference' };

  if (!fdiConfigured()) {
    if (String(ref).startsWith('STUB-') || String(ref).startsWith('nm_')) {
      return {
        status: 'SUCCESSFUL',
        details: { trxRef: ref, trxStatus: 'successful', stub: true },
      };
    }
    return { status: 'PENDING' };
  }

  const { status, body } = await fdiRequest('GET', `/momo/trx/${encodeURIComponent(ref)}/info`);
  const data = (body.data as Json) || {};
  const trxStatus = String(data.trxStatus || data.state || '').toLowerCase();

  if (status === 200 && ['successful', 'success', 'completed'].includes(trxStatus)) {
    return { status: 'SUCCESSFUL', details: data };
  }
  if (['failed', 'fail', 'declined', 'cancelled', 'canceled'].includes(trxStatus)) {
    return {
      status: 'FAILED',
      reason: String(data.channelMsg || data.message || 'Payment failed'),
      details: data,
    };
  }
  if (status === 404) return { status: 'PENDING', details: data };
  return { status: 'PENDING', details: data };
}

export function parseFdiWebhook(body: unknown): {
  providerRef: string;
  gwRef?: string;
  status: 'PAID' | 'FAILED' | 'PENDING';
  message?: string;
} {
  const payload = (body && typeof body === 'object' ? body : {}) as Json;
  const data = (payload.data && typeof payload.data === 'object' ? payload.data : payload) as Json;
  const state = String(data.state || data.trxStatus || payload.status || '').toLowerCase();
  const trxRef = String(data.trxRef || data.trx_ref || '');
  const gwRef = data.gwRef ? String(data.gwRef) : undefined;

  let status: 'PAID' | 'FAILED' | 'PENDING' = 'PENDING';
  if (['successful', 'success', 'completed', 'paid'].includes(state) || payload.status === 'success') {
    status = 'PAID';
  } else if (['failed', 'fail', 'declined', 'cancelled', 'canceled'].includes(state) || payload.status === 'fail') {
    status = 'FAILED';
  }

  return {
    providerRef: trxRef || gwRef || '',
    gwRef,
    status,
    message: data.message ? String(data.message) : undefined,
  };
}

export function webhookPayloadHash(provider: string, body: unknown) {
  return createHash('sha256').update(JSON.stringify({ provider, body })).digest('hex');
}
