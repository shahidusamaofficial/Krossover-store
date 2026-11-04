import { notFound } from 'next/navigation';
import { getProduct, rs } from '../../../lib/data';
import Garment from '../../../components/Garment';
import OrderForm from './OrderForm';

export default async function Product({ params }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  return (
    <div className="pd">
      <div className="stage">
        {p.image_url ? <img src={p.image_url} alt={p.name} /> : <Garment kind={p.slug.includes('hoodie') ? 'hoodie' : 'tee'} />}
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
