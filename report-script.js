let ALL_ORDERS = [];
let ALL_FEEDBACK = [];
let currentRange = "today";

async function ensureAuth() {
  const token = sessionStorage.getItem("kz_token");
  if (!token) { window.location.href = "login.html"; return false; }
  const ok = await validateToken(token);
  if (!ok) { sessionStorage.removeItem("kz_token"); window.location.href = "login.html"; return false; }
  return true;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

function rangeStart() {
  if (currentRange === "today") return startOfToday();
  if (currentRange === "7") { const d = startOfToday(); d.setDate(d.getDate() - 6); return d; }
  if (currentRange === "30") { const d = startOfToday(); d.setDate(d.getDate() - 29); return d; }
  return new Date(0);
}

function inRange(iso) {
  return new Date(iso) >= rangeStart();
}

function dayKey(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function setRange(range) {
  currentRange = range;
  document.querySelectorAll("#rangeTabs .filter-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.range === range));
  render();
}

function bar(value, max) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `<div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>`;
}

const FACE_BY_RATING = { 1: "😡", 2: "🙁", 3: "😐", 4: "🙂", 5: "😄" };

function feedbackPanelHTML() {
  const fb = ALL_FEEDBACK.filter(f => inRange(f.created_at));
  if (!fb.length) {
    return `
      <section class="report-panel">
        <h2><i class="fa-solid fa-face-smile"></i> Satisfaction client</h2>
        <p class="report-empty">Aucun avis sur la période.</p>
      </section>`;
  }
  const count = fb.length;
  const avg = fb.reduce((s, f) => s + Number(f.rating), 0) / count;
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  fb.forEach(f => { dist[f.rating] = (dist[f.rating] || 0) + 1; });
  const max = Math.max(...Object.values(dist));

  const rows = [5, 4, 3, 2, 1].map(r => `
    <div class="bar-row">
      <span class="bar-label">${FACE_BY_RATING[r]} ${r}</span>
      ${bar(dist[r], max)}
      <span class="bar-value">${dist[r]}</span>
    </div>`).join("");

  return `
    <section class="report-panel">
      <h2><i class="fa-solid fa-face-smile"></i> Satisfaction client</h2>
      <div class="fb-score">
        <span class="fb-avg">${avg.toFixed(1)}</span><span class="fb-out">/ 5</span>
        <span class="fb-count">${count} avis</span>
      </div>
      ${rows}
    </section>`;
}

function render() {
  const orders = ALL_ORDERS.filter(o => inRange(o.created_at));
  const done = orders.filter(o => o.status === "done");
  const cancelled = orders.filter(o => o.status === "cancelled");

  const revenue = done.reduce((s, o) => s + Number(o.total), 0);
  const count = done.length;
  const avg = count ? revenue / count : 0;

  const itemMap = new Map();
  const catMap = new Map();
  done.forEach(o => (o.items || []).forEach(it => {
    const lineRevenue = Number(it.price) * it.qty;
    const cur = itemMap.get(it.name) || { qty: 0, revenue: 0 };
    cur.qty += it.qty; cur.revenue += lineRevenue;
    itemMap.set(it.name, cur);
    const cat = itemCategory(it.name) || "Autres";
    catMap.set(cat, (catMap.get(cat) || 0) + lineRevenue);
  }));

  const topItems = [...itemMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const cats = [...catMap.entries()]
    .map(([name, rev]) => ({ name, rev }))
    .sort((a, b) => b.rev - a.rev);
  const catMax = cats.length ? cats[0].rev : 0;

  const dayMap = new Map();
  done.forEach(o => { const k = dayKey(o.created_at); dayMap.set(k, (dayMap.get(k) || 0) + Number(o.total)); });
  const days = [...dayMap.entries()].map(([k, rev]) => ({ k, rev }));
  const dayMax = days.reduce((m, d) => Math.max(m, d.rev), 0);

  const root = document.getElementById("reportRoot");
  root.innerHTML = `
    <div class="stats-bar">
      <div class="stat-card highlight">
        <span class="stat-label">Chiffre d'affaires</span>
        <span class="stat-value">${formatPrice(revenue)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Commandes servies</span>
        <span class="stat-value">${count}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Ticket moyen</span>
        <span class="stat-value">${formatPrice(avg)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Annulées</span>
        <span class="stat-value">${cancelled.length}</span>
      </div>
    </div>

    <div class="report-grid">
      <section class="report-panel">
        <h2><i class="fa-solid fa-ranking-star"></i> Top articles</h2>
        ${topItems.length ? `
          <table class="report-table">
            <thead><tr><th>Article</th><th>Qté</th><th>CA</th></tr></thead>
            <tbody>
              ${topItems.map(it => `
                <tr>
                  <td>${escapeHtml(it.name)}</td>
                  <td class="num">${it.qty}</td>
                  <td class="num accent">${formatPrice(it.revenue)}</td>
                </tr>`).join("")}
            </tbody>
          </table>` : `<p class="report-empty">Aucune vente sur la période.</p>`}
      </section>

      <section class="report-panel">
        <h2><i class="fa-solid fa-layer-group"></i> CA par catégorie</h2>
        ${cats.length ? cats.map(c => `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(c.name)}</span>
            ${bar(c.rev, catMax)}
            <span class="bar-value">${formatPrice(c.rev)}</span>
          </div>`).join("") : `<p class="report-empty">Aucune vente sur la période.</p>`}
      </section>

      <section class="report-panel">
        <h2><i class="fa-solid fa-calendar-day"></i> CA par jour</h2>
        ${days.length ? days.map(d => `
          <div class="bar-row">
            <span class="bar-label">${d.k}</span>
            ${bar(d.rev, dayMax)}
            <span class="bar-value">${formatPrice(d.rev)}</span>
          </div>`).join("") : `<p class="report-empty">Aucune vente sur la période.</p>`}
      </section>

      ${feedbackPanelHTML()}
    </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!(await ensureAuth())) return;
  try {
    ALL_ORDERS = await getOrders();
  } catch (e) {
    if (e.status === 401) return logout();
    document.getElementById("reportRoot").innerHTML = `<p class="empty-pos">Erreur de chargement.</p>`;
    return;
  }
  try {
    ALL_FEEDBACK = await getFeedback();
  } catch (e) {
    ALL_FEEDBACK = [];
  }
  render();
});
