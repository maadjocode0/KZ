let ALL_ORDERS = [];
let ALL_FEEDBACK = [];
let currentRange = "today";
let catChartRef = null;
let dayChartRef = null;
let selectedCats = new Set(); // empty = all categories
let customFrom = null;
let customTo = null;

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
  const d = new Date(iso);
  if (currentRange === "custom") {
    return (!customFrom || d >= customFrom) && (!customTo || d <= customTo);
  }
  return d >= rangeStart();
}

function dayKey(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function setRange(range) {
  currentRange = range;
  document.querySelectorAll("#rangeTabs .filter-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.range === range));
  const applyBtn = document.getElementById("applyRange");
  if (applyBtn) applyBtn.classList.remove("active");
  render();
}

function applyCustomRange() {
  const f = document.getElementById("dateFrom").value;
  const t = document.getElementById("dateTo").value;
  if (!f && !t) return;
  customFrom = f ? new Date(f + "T00:00:00") : new Date(0);
  customTo = t ? new Date(t + "T23:59:59.999") : new Date();
  if (customFrom > customTo) { const tmp = customFrom; customFrom = customTo; customTo = tmp; }
  currentRange = "custom";
  document.querySelectorAll("#rangeTabs .filter-tab").forEach(x => x.classList.remove("active"));
  const applyBtn = document.getElementById("applyRange");
  if (applyBtn) applyBtn.classList.add("active");
  render();
}

// ===== Category filter (empty selection = all categories) =====
function matchCat(name) {
  return selectedCats.size === 0 || selectedCats.has(itemCategory(name) || "Autres");
}

function populateCatFilter() {
  const list = document.getElementById("catFilterList");
  if (!list || typeof MENU_DATA === "undefined") return;
  list.innerHTML = MENU_DATA.map(b =>
    `<label class="cat-opt"><input type="checkbox" value="${escapeHtml(b.category)}" onchange="onCatChange()" /> ${escapeHtml(b.category)}</label>`
  ).join("");
}

function onCatChange() {
  selectedCats = new Set(
    [...document.querySelectorAll("#catFilterList input:checked")].map(i => i.value)
  );
  updateCatLabel();
  render();
}

function setAllCats(all) {
  document.querySelectorAll("#catFilterList input").forEach(i => { i.checked = all; });
  onCatChange();
}

function updateCatLabel() {
  const label = document.getElementById("catFilterLabel");
  if (label) {
    label.textContent = selectedCats.size === 0
      ? "Toutes les catégories"
      : `${selectedCats.size} catégorie${selectedCats.size > 1 ? "s" : ""}`;
  }
  const btn = document.getElementById("catFilterBtn");
  if (btn) btn.classList.toggle("active", selectedCats.size > 0);
}

function toggleCatFilter(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById("catFilterPanel");
  if (panel) panel.hidden = !panel.hidden;
}

function clearFilters() {
  selectedCats = new Set();
  document.querySelectorAll("#catFilterList input").forEach(i => { i.checked = false; });
  updateCatLabel();
  const df = document.getElementById("dateFrom"); if (df) df.value = "";
  const dt = document.getElementById("dateTo"); if (dt) dt.value = "";
  setRange("today");
}

function filterSummaryHTML(filtering) {
  const parts = [];
  if (currentRange === "custom" && (customFrom || customTo)) {
    const fmt = (d) => d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "…";
    parts.push(`<span><i class="fa-solid fa-calendar-day"></i> ${fmt(customFrom)} → ${fmt(customTo)}</span>`);
  }
  if (filtering) {
    parts.push(`<span><i class="fa-solid fa-layer-group"></i> ${[...selectedCats].map(escapeHtml).join(", ")}</span>`);
  }
  if (!parts.length) return "";
  return `<div class="filter-summary">Filtre actif — ${parts.join(" · ")}<button class="filter-clear" onclick="clearFilters()">Réinitialiser</button></div>`;
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
  const filtering = selectedCats.size > 0;

  // Per-order revenue, narrowed to the selected categories when a filter is active.
  // (No filter => use the order total, which equals the sum of all its items.)
  const orderRevenue = (o) => filtering
    ? (o.items || []).reduce((s, it) => s + (matchCat(it.name) ? Number(it.price) * it.qty : 0), 0)
    : Number(o.total);

  let revenue = 0, count = 0;
  done.forEach(o => {
    const r = orderRevenue(o);
    revenue += r;
    if (!filtering || r > 0) count++; // orders served = orders containing the selected category
  });
  const avg = count ? revenue / count : 0;

  const itemMap = new Map();
  const catMap = new Map();
  done.forEach(o => (o.items || []).forEach(it => {
    if (!matchCat(it.name)) return;
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
  // Group into the top 8 categories + "Autres" so the doughnut stays readable.
  const catTop = cats.slice(0, 8);
  const catRest = cats.slice(8).reduce((s, c) => s + c.rev, 0);
  const catsForChart = catRest > 0 ? [...catTop, { name: "Autres", rev: catRest }] : catTop;

  const dayMap = new Map(); // sortKey (yyyy-mm-dd) -> { label, rev }
  done.forEach(o => {
    const dayRev = orderRevenue(o);
    if (dayRev <= 0) return;
    const d = new Date(o.created_at);
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const cur = dayMap.get(sortKey) || { label: dayKey(o.created_at), rev: 0 };
    cur.rev += dayRev;
    dayMap.set(sortKey, cur);
  });
  const days = [...dayMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => ({ k: v.label, rev: v.rev }));

  const root = document.getElementById("reportRoot");
  root.innerHTML = `
    ${filterSummaryHTML(filtering)}
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
        ${catsForChart.length ? `<div class="chart-box"><canvas id="catChart"></canvas></div>` : `<p class="report-empty">Aucune vente sur la période.</p>`}
      </section>

      <section class="report-panel report-panel-wide">
        <h2><i class="fa-solid fa-calendar-day"></i> CA par jour</h2>
        ${days.length ? `<div class="chart-box"><canvas id="dayChart"></canvas></div>` : `<p class="report-empty">Aucune vente sur la période.</p>`}
      </section>

      ${feedbackPanelHTML()}
    </div>`;

  buildCharts(catsForChart, days);
}

function buildCharts(cats, days) {
  if (catChartRef) { catChartRef.destroy(); catChartRef = null; }
  if (dayChartRef) { dayChartRef.destroy(); dayChartRef = null; }
  if (typeof Chart === "undefined") return;

  const gold = "#c9a84c";
  Chart.defaults.color = "#c9d1d9";
  Chart.defaults.font.family = "Inter, sans-serif";

  const catCanvas = document.getElementById("catChart");
  if (catCanvas && cats.length) {
    const palette = ["#c9a84c", "#e0c074", "#b9933f", "#a9842f", "#d4b86a", "#8a6d2a", "#e6cf95", "#7d6b3f", "#5c5230"];
    catChartRef = new Chart(catCanvas, {
      type: "doughnut",
      data: {
        labels: cats.map(c => c.name),
        datasets: [{
          data: cats.map(c => c.rev),
          backgroundColor: cats.map((_, i) => palette[i % palette.length]),
          borderColor: "#161b22",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: { position: "right", labels: { boxWidth: 12, padding: 9, font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${formatPrice(c.parsed)}` } }
        }
      }
    });
  }

  const dayCanvas = document.getElementById("dayChart");
  if (dayCanvas && days.length) {
    dayChartRef = new Chart(dayCanvas, {
      type: "bar",
      data: {
        labels: days.map(d => d.k),
        datasets: [{ data: days.map(d => d.rev), backgroundColor: gold, borderRadius: 6, maxBarThickness: 46 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${formatPrice(c.parsed.y)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.06)" }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }
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
  populateCatFilter();
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("catFilterPanel");
    const btn = document.getElementById("catFilterBtn");
    if (panel && !panel.hidden && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
      panel.hidden = true;
    }
  });
  render();
});
