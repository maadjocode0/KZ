// KZ Café Lounge — dedicated Supabase project.
// The publishable (anon) key is meant to be public; Row Level Security (see
// supabase-setup.sql) is what protects the data. Run supabase-setup.sql once in
// this project's SQL editor before ordering/POS will work.
const SUPABASE_URL = "https://ecbhkcnhgyrppqzrczsz.supabase.co";
const SUPABASE_KEY = "sb_publishable_G8Cu4CjtS6Wh-Q05gMaOGg_t5CWh3Nb";

function getAuthToken() {
  return sessionStorage.getItem("kz_token") || SUPABASE_KEY;
}

async function supabaseRequest(method, path, body = null, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${getAuthToken()}`,
    ...extraHeaders
  };
  if (method === "POST" || method === "PATCH") {
    headers["Prefer"] = extraHeaders["Prefer"] || "return=representation";
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, options);
  if (!res.ok) {
    const err = new Error((await res.text()) || res.statusText);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function getOrders() {
  return supabaseRequest("GET", "/orders?select=*&order=created_at.desc");
}

async function getOrderById(id) {
  const rows = await supabaseRequest("GET", `/orders?id=eq.${id}&select=*`);
  return rows[0] || null;
}

async function createOrder(tableNumber, items, total, notes, tableVerified) {
  const base = { table_number: tableNumber, items, total, status: "pending" };
  const withNotes = (notes && notes.trim()) ? { ...base, notes: notes.trim() } : { ...base };
  const full = { ...withNotes, table_verified: !!tableVerified };
  try {
    return (await supabaseRequest("POST", "/orders", full))[0] || null;
  } catch (e1) {
    try {
      return (await supabaseRequest("POST", "/orders", withNotes))[0] || null;
    } catch (e2) {
      return (await supabaseRequest("POST", "/orders", base))[0] || null;
    }
  }
}

async function updateOrderStatus(id, status) {
  return supabaseRequest("PATCH", `/orders?id=eq.${id}`, { status });
}

async function updateOrderItems(id, items, total) {
  return supabaseRequest("PATCH", `/orders?id=eq.${id}`, { items, total });
}

async function getMenuItems() {
  return supabaseRequest("GET", "/menu_items?select=*");
}

async function upsertMenuItem(row) {
  return supabaseRequest(
    "POST", "/menu_items",
    { ...row, updated_at: new Date().toISOString() },
    { "Prefer": "resolution=merge-duplicates,return=representation" }
  );
}

async function getCategoryImages() {
  return supabaseRequest("GET", "/category_images?select=*");
}

async function upsertCategoryImage(category, image_url) {
  return supabaseRequest(
    "POST", "/category_images",
    { category, image_url, updated_at: new Date().toISOString() },
    { "Prefer": "resolution=merge-duplicates,return=representation" }
  );
}

function publicPhotoUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/menu-photos/${path}`;
}

async function uploadPhoto(fileOrBlob, ext = "jpg") {
  const path = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-photos/${path}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${getAuthToken()}`,
      "Content-Type": fileOrBlob.type || "image/jpeg",
      "x-upsert": "true"
    },
    body: fileOrBlob
  });
  if (!res.ok) {
    const err = new Error((await res.text()) || res.statusText);
    err.status = res.status;
    throw err;
  }
  return publicPhotoUrl(path);
}

async function submitFeedback(orderId, rating) {
  return supabaseRequest("POST", "/feedback", { order_id: orderId || null, rating }, { "Prefer": "return=minimal" });
}

async function getFeedback() {
  return supabaseRequest("GET", "/feedback?select=*&order=created_at.desc");
}

async function validateToken(token) {
  if (!token || token === SUPABASE_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}

function logout() {
  sessionStorage.removeItem("kz_token");
  window.location.href = "login.html";
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
