// Admin products API.
// GET  /api/admin/products        -> { designs, blanks } for the form dropdowns
// GET  /api/admin/products?blank_id=X -> { blank: { variations } } for the variation picker
// POST /api/admin/products        -> creates CeePrinto listings + Supabase product row
//
// Auth: ADMIN_TOKEN env var (Bearer header).
// The shop is auto-created on first publish (no separate setup step needed).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  listDesigns,
  listCatalogProducts,
  getCatalogProduct,
  listShops,
  createShop,
  createListingsBulk,
  getDesignMockups,
  pickMockupImageUrl,
} from "@/lib/ceeprinto";

const fail = (error, status) => NextResponse.json({ error }, { status });
const authed = (req) => (req.headers.get("authorization") || "") === `Bearer ${process.env.ADMIN_TOKEN}`;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Auto-find or create the shop. Idempotent via external_shop_id "krossover".
async function ensureShop() {
  const configured = process.env.CEEPRINTO_SHOP_ID;
  if (configured) return { id: configured, created: false };

  const externalId = "krossover";
  try {
    const shopsRes = await listShops();
    const shops = shopsRes.data || shopsRes || [];
    const existing = shops.find((s) => s.external_shop_id === externalId);
    if (existing) return { id: existing.id, created: false };
  } catch (e) {
    // If listing shops fails, try to create anyway.
  }
  const shop = await createShop({ name: "Krossover", external_shop_id: externalId });
  const id = shop.id || shop.data?.id;
  if (!id) throw new Error(`CeePrinto createShop did not return an id: ${JSON.stringify(shop)}`);
  return { id, created: true };
}

// GET — populate the form.
export async function GET(req) {
  if (!authed(req)) return fail("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const blankId = searchParams.get("blank_id");

  if (blankId) {
    try {
      const blank = await getCatalogProduct(blankId);
      const b = blank.data || blank;
      return NextResponse.json({
        blank: {
          id: b.id,
          name: b.name || b.title || `Blank #${b.id}`,
          variations: (b.variations || []).map((v) => ({
            variation_id: v.variation_id ?? v.id,
            label: v.name || v.title ||
              [v.color, v.size].filter(Boolean).join(" / ") ||
              `Variation ${v.variation_id ?? v.id}`,
            color: v.color || null,
            size: v.size || null,
          })),
        },
      });
    } catch (e) {
      return fail(`CeePrinto getCatalogProduct failed: ${e.message}`, 502);
    }
  }

  try {
    const [designsRes, blanksRes] = await Promise.all([listDesigns(), listCatalogProducts(1, 100)]);
    const designs = designsRes.data || designsRes || [];
    const blanks = blanksRes.data || blanksRes || [];
    return NextResponse.json({
      designs: designs.map((d) => ({
        id: d.id,
        name: d.name || d.title || `Design #${d.id}`,
        thumb: d.thumb_url || d.thumbnail || d.image_url || null,
      })),
      blanks: blanks.map((b) => ({
        id: b.id,
        name: b.name || b.title || `Blank #${b.id}`,
        variation_count: b.variations?.length || 0,
      })),
    });
  } catch (e) {
    return fail(`CeePrinto fetch failed: ${e.message}`, 502);
  }
}

// POST — publish a product.
export async function POST(req) {
  if (!authed(req)) return fail("Unauthorized", 401);

  let b;
  try { b = await req.json(); } catch { return fail("Invalid JSON", 400); }

  const designId = Number(b.design_id);
  const blankProductId = Number(b.blank_product_id);
  const variations = Array.isArray(b.variations) ? b.variations : [];
  const name = String(b.name || "").trim();
  let slug = slugify(b.slug || name);
  const pricePkr = Number(b.price_pkr);
  const description = String(b.description || "").trim();

  if (!designId) return fail("Pick a design.", 400);
  if (!blankProductId) return fail("Pick a blank product.", 400);
  if (variations.length === 0) return fail("Pick at least one variation (size/color).", 400);
  if (!name) return fail("Product name is required.", 400);
  if (!slug) return fail("Could not generate a slug from the name. Enter one manually.", 400);
  if (!Number.isFinite(pricePkr) || pricePkr < 100) return fail("Price must be at least Rs 100.", 400);

  let sizes = Array.isArray(b.sizes) && b.sizes.length
    ? b.sizes.map((s) => String(s).trim()).filter(Boolean)
    : variations.map((_, i) => `V${i + 1}`);
  if (sizes.length !== variations.length) {
    sizes = variations.map((_, i) => sizes[i] || `V${i + 1}`);
  }

  let db;
  try { db = supabaseClient(); } catch (e) { return fail(e.message, 503); }

  // 1. Ensure shop exists (auto-created on first publish).
  let shopInfo;
  try {
    shopInfo = await ensureShop();
  } catch (e) {
    return fail(`Shop setup failed: ${e.message}. You may need to create the shop manually in CeePrinto's dashboard and set CEEPRINTO_SHOP_ID.`, 502);
  }

  // 2. Create listings (one per variation, bulk upsert on external_variant_id).
  const items = variations.map((v, i) => ({
    design_id: designId,
    product_id: blankProductId,
    variation_id: Number(v.variation_id) || 0,
    external_product_id: slug,
    external_variant_id: `${slug}-${i}`,
    external_sku: `${slug}-${sizes[i]}`.toUpperCase(),
  }));

  let bulkResult;
  try {
    bulkResult = await createListingsBulk(shopInfo.id, items);
  } catch (e) {
    return fail(`CeePrinto createListingsBulk failed: ${e.message}`, 502);
  }

  const meta = bulkResult.meta || {};
  if (meta.failed && meta.created === 0) {
    return fail(`All ${meta.failed} listings failed: ${JSON.stringify(meta.errors || [])}`, 502);
  }

  // 3. Fetch mockup (best-effort, non-fatal).
  let imageUrl = null;
  try {
    imageUrl = pickMockupImageUrl(await getDesignMockups(designId));
  } catch (e) {
    console.error("[admin/products] mockup fetch failed (non-fatal):", e.message);
  }

  // 4. Build size -> external_variant_id map (for order forwarding later).
  const ceeprintoVariants = {};
  variations.forEach((_, i) => { ceeprintoVariants[sizes[i]] = `${slug}-${i}`; });

  // 5. Insert the Supabase product row.
  const row = {
    name,
    slug,
    price_pkr: pricePkr,
    description: description || null,
    sizes,
    image_url: imageUrl,
    ceeprinto_product_id: String(designId),
    ceeprinto_variants: ceeprintoVariants,
    active: true,
  };

  const { data: inserted, error } = await db
    .from("products")
    .insert(row)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({
      error: `Supabase insert failed: ${error.message}`,
      ceeprinto_listings_created: meta.created || 0,
      shop_id: shopInfo.id,
      shop_created: shopInfo.created,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    product_id: inserted.id,
    slug: inserted.slug,
    store_url: `/product/${inserted.slug}`,
    image_url: imageUrl,
    ceeprinto_listings_created: meta.created || items.length,
    ceeprinto_listings_failed: meta.failed || 0,
    shop_id: shopInfo.id,
    shop_created: shopInfo.created,
    shop_hint: shopInfo.created
      ? `Shop #${shopInfo.id} was auto-created. Add CEEPRINTO_SHOP_ID=${shopInfo.id} to Vercel env vars and redeploy so future publishes are faster.`
      : null,
  });
}
