import { notFound } from 'next/navigation';
import { getProduct, rs } from '../../../lib/data';
import Gallery from './Gallery';
import OrderForm from './OrderForm';

export const dynamic = 'force-dynamic';

export default async function Product({ params }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();

  // DEBUG: raw fetch bypassing supabase-js
  const testRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=*&slug=eq.sunday-tee`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );
  const testJson = await testRes.json();
  const testRow = testJson[0] || {};

  // Build the image list: prefer the new images[] array; fall back to legacy image_url.
  const images = (p.images && p.images.length)
    ? p.images
    : (p.image_url ? [p.image_url] : []);

  const garmentKind = p.slug && p.slug.includes('hoodie') ? 'hoodie' : 'tee';

  return (
    <div className="pd">
      <div className="pd-media">
        <div style={{ color: 'red', padding: 20, fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', background: '#fff' }}>
          <strong>=== getProduct() result ===</strong><br/>
          video_url = {JSON.stringify(p.video_url)}<br/>
          all keys = {Object.keys(p).join(', ')}<br/><br/>
          <strong>=== RAW fetch() result ===</strong><br/>
          status = {testRes.status}<br/>
          video_url = {JSON.stringify(testRow.video_url)}<br/>
          all keys = {Object.keys(testRow).join(', ')}
        </div>
        <Gallery images={images} alt={p.name} garmentKind={garmentKind} />

        {p.video_url && (
          <div className="video">
            <video src={p.video_url} controls playsinline preload="metadata" />
          </div>
        )}
      </div>

      <div className="panel glass">
        <h1 className="display">{p.name}</h1>
        <p style={{ fontSize: 22, margin: '0 0 8px' }}>{rs(p.price_pkr)}</p>
        <p className="note" style={{ margin: 0 }}>{p.description}</p>
        <ul className="facts">
          <li>Printed to order in Pakistan</li>
          <li>Pay the courier when it arrives</li>
          <li>We confirm on WhatsApp before printing</li>
        </ul>
        <OrderForm product={{ slug: p.slug, price: p.price_pkr, sizes: p.sizes }} />
      </div>
    </div>
  );
}
