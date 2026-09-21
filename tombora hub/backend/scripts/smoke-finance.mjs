const API = process.env.API_URL || 'http://localhost:4000/api/v1';

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`${path} -> ${json?.error?.code || res.status}: ${json?.error?.message || res.statusText}`);
  }
  return json.data;
}

async function main() {
  const customer = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer@demo.rw', password: 'Demo@Tombora1' }),
  });
  const seller = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'seller@demo.rw', password: 'Demo@Tombora1' }),
  });

  const cHeaders = { Authorization: `Bearer ${customer.accessToken}` };
  const sHeaders = { Authorization: `Bearer ${seller.accessToken}` };

  const product = await req('/products/classic-cotton-tshirt');
  const variantId = product.product.variants[0].id;

  await req('/cart/items', {
    method: 'POST',
    headers: cHeaders,
    body: JSON.stringify({ variantId, quantity: 1 }),
  });

  const address = await req('/addresses', {
    method: 'POST',
    headers: cHeaders,
    body: JSON.stringify({
      fullName: 'Demo Customer',
      phone: '+250780000002',
      province: 'Kigali City',
      district: 'Gasabo',
      isDefault: true,
    }),
  });

  const checkout = await req('/checkout', {
    method: 'POST',
    headers: cHeaders,
    body: JSON.stringify({
      addressId: address.address.id,
      deliveryMethod: 'SELLER_DELIVERY',
      paymentMethod: 'MOCK',
      idempotencyKey: `fin_${Date.now()}`,
    }),
  });

  await req(`/orders/${checkout.order.id}/mock-pay`, { method: 'POST', headers: cHeaders });

  const financeAfterPay = await req('/sellers/me/finance', { headers: sHeaders });
  const orders = await req('/sellers/me/orders', { headers: sHeaders });
  const sellerOrder = orders.items.find((o) => o.parentOrderNumber === checkout.order.orderNumber);

  await req(`/sellers/me/orders/${sellerOrder.id}/status`, {
    method: 'PATCH',
    headers: sHeaders,
    body: JSON.stringify({ status: 'PROCESSING' }),
  });
  await req(`/sellers/me/orders/${sellerOrder.id}/status`, {
    method: 'PATCH',
    headers: sHeaders,
    body: JSON.stringify({ status: 'READY_FOR_SHIPMENT' }),
  });
  await req(`/sellers/me/orders/${sellerOrder.id}/status`, {
    method: 'PATCH',
    headers: sHeaders,
    body: JSON.stringify({ status: 'SHIPPED' }),
  });
  await req(`/sellers/me/orders/${sellerOrder.id}/status`, {
    method: 'PATCH',
    headers: sHeaders,
    body: JSON.stringify({ status: 'DELIVERED' }),
  });

  const financeAfterDelivery = await req('/sellers/me/finance', { headers: sHeaders });

  console.log(
    JSON.stringify(
      {
        ok: true,
        orderNumber: checkout.order.orderNumber,
        pendingAfterPay: financeAfterPay.finance.wallet.pendingBalance,
        availableAfterDelivery: financeAfterDelivery.finance.wallet.availableBalance,
        commissionTotal: financeAfterDelivery.finance.totals.commission,
        ledgerTypes: financeAfterDelivery.finance.ledger.slice(0, 5).map((e) => e.entryType),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
