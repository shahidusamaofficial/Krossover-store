// CeePrinto API client. Uses your CEEPRINTO_API_KEY env var.
// Auth: Bearer cp_live_... key. Base: /wp-json/ceeprinto/v2 (REST).

const BASE = "https://ceeprinto.com/wp-json/ceeprinto/v2";

export async function cpFetch(path, init = {}) {
  const KEY = process.env.CEEPRINTO_API_KEY;
  if (!KEY) throw new Error("CEEPRINTO_API_KEY env var is not set");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CeePrinto ${path}: ${res.status} ${body.slice(0, 500)}`);
  }
  return res.json();
}

// --- Reads (designs:read, products:read) ---
export const listDesigns = () => cpFetch("/designs");
export const getDesignMockups = (id) => cpFetch(`/designs/${id}/variation-mockups`);
export const listCatalogProducts = (page = 1, perPage = 100) =>
  cpFetch(`/catalog/products?page=${page}&per_page=${perPage}`);
export const getCatalogProduct = (id) => cpFetch(`/catalog/products/${id}`);

// --- Shops + listings (listings:write) ---
export const listShops = () => cpFetch("/shops");
export const createShop = ({ name, external_shop_id, channel = "custom" }) =>
  cpFetch("/shops", {
    method: "POST",
    body: JSON.stringify({ name, external_shop_id, channel }),
  });
export const createListingsBulk = (shopId, items) =>
  cpFetch(`/shops/${shopId}/listings/bulk`, {
    method: "POST",
    body: JSON.stringify({ listings: items }),
  });

// --- Orders (orders:write) — used by app/api/orders/route.js ---
export const createOrder = (body) =>
  cpFetch("/orders", { method: "POST", body: JSON.stringify(body) });

// Helper: pull a usable front mockup image URL from the variation-mockups response.
// Tries several possible response shapes.
export function pickMockupImageUrl(mockupsResponse) {
  const candidates = [
    mockupsResponse?.cells,
    mockupsResponse?.data?.cells,
    mockupsResponse?.mockups,
    mockupsResponse?.data?.mockups,
    mockupsResponse?.items,
    mockupsResponse?.data?.items,
    mockupsResponse?.data,
    mockupsResponse,
  ];
  for (const arr of candidates) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const front = arr.find((c) => c.stage_index === 0) || arr[0];
    const url = front?.image_url || front?.thumb_url || front?.url || front?.mockup_url || null;
    if (url) return url;
  }
  return null;
}