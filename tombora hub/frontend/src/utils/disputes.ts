import type { DisputeResolution, DisputeStatus, DisputeType } from '@/api/hooks';
import type { StatusTone } from './status';

export const DISPUTE_TYPE_OPTIONS: Array<{ value: DisputeType; label: string; hint: string }> = [
  {
    value: 'SHIPPING_DELAY',
    label: 'Shipping is delayed',
    hint: 'The parcel has not shipped or is late compared to what was promised.',
  },
  {
    value: 'NOT_DELIVERED',
    label: 'Order not delivered',
    hint: 'The order shows as shipped or delivered but you never received it.',
  },
  {
    value: 'DAMAGED_ITEM',
    label: 'Item arrived damaged',
    hint: 'Broken, torn, leaking, or otherwise damaged on arrival.',
  },
  { value: 'WRONG_ITEM', label: 'Wrong item received', hint: 'Different product, size, or colour.' },
  { value: 'MISSING_ITEM', label: 'Item missing from parcel', hint: 'Part of the order was not in the parcel.' },
  {
    value: 'NOT_AS_DESCRIBED',
    label: 'Not as described',
    hint: 'Quality, material, or features differ from the listing.',
  },
  {
    value: 'PAYMENT_ISSUE',
    label: 'Payment problem',
    hint: 'You were charged but the order is not confirmed, or charged twice.',
  },
  {
    value: 'SELLER_UNRESPONSIVE',
    label: 'Seller not responding',
    hint: 'The seller is not replying to messages about your order.',
  },
  { value: 'OTHER', label: 'Something else', hint: 'Any other problem with this order.' },
];

export const RESOLUTION_OPTIONS: Array<{ value: DisputeResolution; label: string }> = [
  { value: 'REDELIVERY', label: 'Deliver the order' },
  { value: 'REPLACEMENT', label: 'Send a replacement' },
  { value: 'FULL_REFUND', label: 'Full refund' },
  { value: 'PARTIAL_REFUND', label: 'Partial refund' },
  { value: 'RETURN_AND_REFUND', label: 'Return and refund' },
  { value: 'NO_ACTION', label: 'No action needed' },
  { value: 'OTHER', label: 'Other' },
];

const TYPE_LABEL = Object.fromEntries(DISPUTE_TYPE_OPTIONS.map((o) => [o.value, o.label]));
const RESOLUTION_LABEL = Object.fromEntries(RESOLUTION_OPTIONS.map((o) => [o.value, o.label]));

export function disputeTypeLabel(type: DisputeType) {
  return TYPE_LABEL[type] || type;
}

export function resolutionLabel(resolution?: DisputeResolution | null) {
  return resolution ? RESOLUTION_LABEL[resolution] || resolution : '—';
}

const STATUS_META: Record<DisputeStatus, { label: string; tone: StatusTone }> = {
  OPEN: { label: 'Waiting for seller', tone: 'warning' },
  SELLER_RESPONDED: { label: 'Seller replied', tone: 'accent' },
  ESCALATED: { label: 'Support involved', tone: 'brand' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  REJECTED: { label: 'Closed, no action', tone: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'muted' },
};

export function disputeStatusLabel(status: DisputeStatus) {
  return STATUS_META[status]?.label || status;
}

export function disputeStatusTone(status: DisputeStatus): StatusTone {
  return STATUS_META[status]?.tone || 'muted';
}

export function isDisputeActive(status: DisputeStatus) {
  return status === 'OPEN' || status === 'SELLER_RESPONDED' || status === 'ESCALATED';
}
