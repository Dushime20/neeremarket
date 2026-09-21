export type StatusTone = 'brand' | 'accent' | 'muted' | 'success' | 'warning' | 'danger';

const SUCCESS = /ACTIVE|VERIFIED|COMPLETED|DELIVERED|PAID|PUBLISHED|APPROVED|SUCCESS|IN_STOCK/;
const WARNING = /PENDING|REVIEW|REQUESTED|DRAFT|HOLD|PROCESSING|SHIPPED|READY|LOW_STOCK/;
const DANGER = /REJECT|SUSPEND|CANCEL|FAIL|OUT_OF_STOCK|BLOCK|ARCHIVED/;

export function statusTone(status?: string | null): StatusTone {
  const value = (status || '').toUpperCase();
  if (SUCCESS.test(value)) return 'success';
  if (DANGER.test(value)) return 'danger';
  if (WARNING.test(value)) return 'warning';
  return 'muted';
}

export function prettyStatus(status?: string | null) {
  return (status || 'Unknown').replace(/_/g, ' ');
}
