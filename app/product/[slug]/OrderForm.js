'use client';
import { useState } from 'react';

export default function OrderForm({ product }) {
  const [size, setSize] = useState(product.sizes[1] || product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: product.slug, size, quantity: qty,
        name: f.get('name'), phone: f.get('phone'), address: f.get('address'), city: f.get('city'),
      }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || 'We couldn't place your order. Check your connection and try again.');
    setDone(j.orderNumber);
  }

  if (done) {
    return (
      <div className="ok">
        <strong>Order #{done} received.</strong>
        <p className="note">Next, we message you on WhatsApp to confirm your size and address. Printing starts after you reply. You pay the courier when it arrives.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div>
        <div className="note" style={{ marginBottom: 8 }}>Size</div>
        <div className="sizes" role="radiogroup" aria-label="Size">
          {product.sizes.map((s) => (
            <label key={s}>
              <input type="radio" name="size" checked={size === s} onChange={() => setSize(s)} />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>
      <label>Quantity
        <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label>Full name<input name="name" required autoComplete="name" /></label>
      <label>WhatsApp number<input name="phone" required inputMode="tel" placeholder="03001234567" autoComplete="tel" /></label>
      <label>Delivery address<textarea name="address" required rows={3} autoComplete="street-address" /></label>
      <label>City<input name="city" required autoComplete="address-level2" /></label>
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Placing your order' : `Order now, pay Rs ${(product.price * qty).toLocaleString('en-PK')} on delivery`}</button>
      <div className="note">We confirm the delivery fee on WhatsApp. You pay nothing online.</div>
    </form>
  );
}
