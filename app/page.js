import { getProducts, rs } from '../lib/data';
import Garment from '../components/Garment';

export const revalidate = 60;
const kind = (p) => (p.slug.includes('hoodie') ? 'hoodie' : 'tee');

export default async function Home() {
  const products = await getProducts();
  return (
    <>
      <section className="hero">
        <div>
          <h1 className="display">Where your worlds cross.</h1>
          <p className="lead">Clothing printed to order in Pakistan. Choose your size, order in a minute, and pay when it arrives.</p>
          <div className="row">
            <a className="btn" href="#shop">Shop new designs</a>
            <a className="btn ghost" href="#how">See how ordering works</a>
          </div>
        </div>
        <div className="art" aria-hidden="true">
          <svg className="draw" viewBox="0 0 120 70" fill="none" strokeWidth="9" strokeLinecap="round">
            <path pathLength="1" d="M15 6C45 6 45 52 75 52" stroke="#fff" />
            <path pathLength="1" d="M15 52C45 52 45 6 75 6" stroke="#C6FF3D" />
          </svg>
          {products.slice(0, 2).map((p, i) => (
            <div key={p.id} className={`tile glass t${i + 1}`}>
              <Garment kind={kind(p)} /><b>{p.name}</b><span>{rs(p.price_pkr)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="trust glass" aria-label="Why order from KROSSOVER">
        <div><b>Pay on delivery</b><span>No card needed. Pay the courier.</span></div>
        <div><b>Made when you order</b><span>Printed in Pakistan, never from old stock.</span></div>
        <div><b>Confirmed on WhatsApp</b><span>We check size and address before printing.</span></div>
      </section>

      <section id="shop">
        <h2 className="display">New designs</h2>
        <div className="grid">
          {products.map((p) => (
            <a key={p.id} href={`/product/${p.slug}`} className="card">
              <div className="shot">
                {p.image_url ? <img src={p.image_url} alt={p.name} /> : <Garment kind={kind(p)} />}
                <span className="price glass">{rs(p.price_pkr)}</span>
              </div>
              <h3>{p.name}</h3>
            </a>
          ))}
        </div>
      </section>

      <section id="how">
        <h2 className="display">Three steps to your door</h2>
        <div className="steps">
          {[['1', 'Pick your piece', 'Choose a design and your size, then add your address.'],
            ['2', 'Confirm on WhatsApp', 'We message you to double-check the details before we print.'],
            ['3', 'Pay when it arrives', 'The courier brings it to you. You pay cash on delivery.']].map(([n, t, d]) => (
            <div key={n} className="step glass"><em>{n}</em><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}