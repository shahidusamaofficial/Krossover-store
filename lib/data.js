import { createClient } from '@supabase/supabase-js';

const samples = [
  { id: 's1', slug: 'crossover-tee', name: 'Crossover tee', description: 'Oversized cotton tee with the crossing-paths chest print.', price_pkr: 2450, image_url: null, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 's2', slug: 'crossover-hoodie', name: 'Crossover hoodie', description: 'Heavy fleece hoodie. Icon on the chest, wordmark on the back.', price_pkr: 4250, image_url: null, sizes: ['S', 'M', 'L', 'XL'] },
];

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

export async function getProducts() {
  const c = db();
  if (!c) return samples;
  const { data } = await c.from('products').select('*').eq('active', true).order('created_at');
  return data && data.length ? data : samples;
}

export async function getProduct(slug) {
  const c = db();
  if (!c) return samples.find((p) => p.slug === slug) || null;
  const { data } = await c.from('products').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  return data || samples.find((p) => p.slug === slug) || null;
}

export const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-PK');
