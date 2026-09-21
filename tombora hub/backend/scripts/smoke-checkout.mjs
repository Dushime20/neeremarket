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
  const auth = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer@demo.rw', password: 'Demo@Tombora1' }),
  });
  const token = auth.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  const product = await req('/products/classic-cotton-tshirt');
  const variantId = product.product.variants[0].id;

  await req('/cart/items', {
    method: 'POST',
    headers,
    body: JSON.stringify({ variantId, quantity: 1 }),
  });

  const address = await req('/addresses', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fullName: 'Demo Customer',
      phone: '+250780000002',
      province: 'Kigali City',
      district: 'Gasabo',
      landmark: 'Near KG 11 Ave',
      isDefault: true,
    }),
  });

  const checkout = await req('/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      addressId: address.address.id,
      deliveryMethod: 'SELLER_DELIVERY',
      paymentMethod: 'MOCK',
      idempotencyKey: `test_${Date.now()}`,
    }),
  });

  const pay = await req(`/orders/${checkout.order.id}/mock-pay`, {
    method: 'POST',
    headers,
  });

  const order = await req(`/orders/${checkout.order.id}`, { headers });

  console.log(
    JSON.stringify(
      {
        ok: true,
        orderNumber: order.order.orderNumber,
        status: order.order.status,
        sellerOrders: order.order.sellerOrders?.map((s) => s.sellerOrderNumber),
        payment: pay.status,
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
