import { Prisma } from '@prisma/client';
import { Errors } from '../shared/errors';

type Tx = Prisma.TransactionClient;

export async function reserveStock(
  tx: Tx,
  variantId: string,
  quantity: number,
  refId: string,
  actorId?: string,
) {
  const inventory = await tx.inventory.findUnique({ where: { variantId } });
  if (!inventory) throw Errors.notFound('Inventory');

  const available = inventory.quantity - inventory.reserved;
  if (available < quantity) throw Errors.insufficientStock();

  const updated = await tx.inventory.update({
    where: { id: inventory.id },
    data: { reserved: inventory.reserved + quantity },
  });

  await tx.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      type: 'RESERVE',
      delta: quantity,
      reason: 'Checkout reservation',
      refType: 'ORDER',
      refId,
      actorId,
    },
  });

  return updated;
}

export async function commitReservedStock(
  tx: Tx,
  variantId: string,
  quantity: number,
  refId: string,
) {
  const inventory = await tx.inventory.findUnique({ where: { variantId } });
  if (!inventory) throw Errors.notFound('Inventory');
  if (inventory.reserved < quantity || inventory.quantity < quantity) {
    throw Errors.insufficientStock();
  }

  const updated = await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: inventory.quantity - quantity,
      reserved: inventory.reserved - quantity,
    },
  });

  await tx.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      type: 'COMMIT_SALE',
      delta: -quantity,
      reason: 'Payment confirmed',
      refType: 'ORDER',
      refId,
    },
  });

  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  });
  if (variant) await syncProductStockStatus(tx, variant.productId);

  return updated;
}

export async function syncProductStockStatus(tx: Tx, productId: string) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return;
  if (product.status !== 'ACTIVE' && product.status !== 'OUT_OF_STOCK') return;

  const variants = await tx.productVariant.findMany({
    where: { productId, isActive: true },
    include: { inventory: true },
  });
  const anyAvailable = variants.some((v) => {
    const quantity = v.inventory?.quantity ?? 0;
    const reserved = v.inventory?.reserved ?? 0;
    return quantity - reserved > 0;
  });
  const nextStatus = anyAvailable ? 'ACTIVE' : 'OUT_OF_STOCK';
  if (product.status !== nextStatus) {
    await tx.product.update({
      where: { id: productId },
      data: { status: nextStatus },
    });
  }
}

export async function releaseReservedStock(
  tx: Tx,
  variantId: string,
  quantity: number,
  refId: string,
  reason = 'Payment failed or expired',
) {
  const inventory = await tx.inventory.findUnique({ where: { variantId } });
  if (!inventory) return;

  const releaseQty = Math.min(quantity, inventory.reserved);
  if (releaseQty <= 0) return;

  await tx.inventory.update({
    where: { id: inventory.id },
    data: { reserved: inventory.reserved - releaseQty },
  });

  await tx.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      type: 'RELEASE',
      delta: -releaseQty,
      reason,
      refType: 'ORDER',
      refId,
    },
  });

  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  });
  if (variant) await syncProductStockStatus(tx, variant.productId);
}
