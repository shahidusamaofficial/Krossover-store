import { createClient } from '@supabase/supabase-js';

const samples = [
  { id: 's1', slug: 'crossover-tee', name: 'Crossover tee', description: 'Oversized cotton tee with the crossing-paths chest print.', price_pkr: 2450, image_url: null, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 's2', slug: 'crossover-hoodie', name: 'Crossover hoodie', description: 'Heavy fleece hoodie. Icon on the chest, wordmark on the back.', price_pkr: 4250, image_url: null, sizes: ['S', 'M', 'L', 'XL'] },
];

function dbConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

// Raw fetch wrapper — bypasses supabase-js schema caching issues.
// supabase-js caches the table's OpenAPI spec and select('*') only returns
// columns that existed when the cache was built. Raw fetch always returns all columns.
async function fetchProducts(filter) {
  const cfg = dbConfig();
  if (!cfg) return null;
  const url = `${cfg.url}/rest/v1/products?${filter}`;
  const res = await fetch(url, {
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export async function getProducts() {
  const data = await fetchProducts('select=*&active=eq.true&order=created_at');
  if (data && data.length) return data;
  return samples;
}

export async function getProduct(slug) {
  const data = await fetchProducts(`select=*&slug=eq.${encodeURIComponent(slug)}&active=eq.true`);
  if (data && data.length) return data[0];
  return samples.find((p) => p.slug === slug) || null;
}

export const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-PK');
