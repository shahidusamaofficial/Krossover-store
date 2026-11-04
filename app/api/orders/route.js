import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Ordering is not set up yet.', 503);

  let b;
  try { b = await req.json(); } catch { return fail('Invalid request.', 400); }

  const name = clean(b.name, 80);
  const address = clean(b.address, 300);
  const city = clean(b.city, 60);
  const phone = clean(b.phone, 20).replace(/[\s-]/g, '');
  const quantity = Number(b.quantity);
  const size = clean(b.size, 6);

  if (!name || !address || !city) return fail('Add your name, address and city so the courier can find you.', 400);
    if (!/^(\+92|0)3\d{9}$/.test(phone)) return fail("That number doesn't look right. Use a Pakistani mobile number like 03001234567.", 400);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) return fail('Quantity must be 1 to 5.', 400);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: p } = await db.from('products').select('id, price_pkr, sizes').eq('slug', clean(b.slug, 80)).eq('active', true).maybeSingle();
  if (!p) return fail('Product not found.', 404);
  if (!p.sizes.includes(size)) return fail('Choose a size to continue.', 400);

  const { data: order, error } = await db.from('orders')
    .insert({ name, phone, address, city, total_pkr: p.price_pkr * quantity })
    .select('id, order_number').single();
    if (error) return fail("We couldn't save your order. Try again in a moment.", 500);

  const { error: e2 } = await db.from('order_items')
    .insert({ order_id: order.id, product_id: p.id, size, quantity, unit_price_pkr: p.price_pkr });
  if (e2) {
    await db.from('orders').delete().eq('id', order.id);
        return fail("We couldn't save your order. Try again in a moment.", 500);
  }
  return NextResponse.json({ orderNumber: order.order_number });
}
