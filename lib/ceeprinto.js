const BASE = "https://ceeprinto.com/wp-json/ceeprinto";
const KEY = process.env.CEEPRINTO_API_KEY;

export async function cpFetch(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`CeePrinto ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

export const listProducts  = ()      => cpFetch("/products");
export const getProduct     = (id)   => cpFetch(`/products/${id}`);
export const createOrder    = (body) => cpFetch("/orders", { method: "POST", body: JSON.stringify(body) });
export const getOrderStatus = (id)   => cpFetch(`/orders/${id}`);