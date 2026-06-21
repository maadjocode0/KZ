const LATE_THRESHOLD_MS = 10 * 60 * 1000;

let knownIds = new Set();
let currentFilter = "pending";
let allOrders = [];



async function ensureAuth() {
  const token = sessionStorage.getItem("kz_token");
  if (!token) { window.location.href = "login.html"; return false; }
  const ok = await validateToken(token);
  if (!ok) { sessionStorage.removeItem("kz_token"); window.location.href = "login.html"; return false; }
  return true;
}



function startClock() {
  const el = document.getElementById("currentTime");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  };
  tick();
  setInterval(tick, 1000);
}



function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.filter === filter);
  });
  renderOrders();
}



function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
}

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

function isActive(status) {
  return status === "pending" || status === "preparing";
}

function isLate(iso) {
  return (Date.now() - new Date(iso).getTime()) > LATE_THRESHOLD_MS;
}

function minutesWaiting(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}



function updateStats() {
  const todayOrders = allOrders.filter(o => isToday(o.created_at));
  const pending = todayOrders.filter(o => o.status === "pending").length;
  const preparing = todayOrders.filter(o => o.status === "preparing").length;
  const done = todayOrders.filter(o => o.status === "done").length;
  const cancelled = todayOrders.filter(o => o.status === "cancelled").length;
  const revenue = todayOrders
    .filter(o => o.status === "done")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("statPending", pending);
  set("statPreparing", preparing);
  set("statDone", done);
  set("statCancelled", cancelled);
  set("statRevenue", formatPrice(revenue));

  const badge = (id, n) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = n;
    el.style.display = n > 0 ? "inline-flex" : "none";
  };
  badge("badgePending", pending);
  badge("badgePreparing", preparing);
}



function getFilteredOrders() {
  const todayOrders = allOrders.filter(o => isToday(o.created_at));
  if (currentFilter === "all") return todayOrders;
  return todayOrders.filter(o => o.status === currentFilter);
}

function getStatusLabel(status) {
  if (status === "preparing") return '<span class="status-badge preparing"><i class="fa-solid fa-fire-burner"></i> En préparation</span>';
  if (status === "done") return '<span class="status-badge done"><i class="fa-solid fa-check"></i> Terminée</span>';
  if (status === "cancelled") return '<span class="status-badge cancelled"><i class="fa-solid fa-xmark"></i> Annulée</span>';
  return '';
}

function getActions(order) {
  const edit = `<button class="btn-edit" onclick="openEdit('${order.id}')"><i class="fa-solid fa-pen-to-square"></i> Modifier</button>`;
  if (order.status === "pending") {
    return `${edit}
      <button class="btn-cancel" onclick="markCancelled('${order.id}')"><i class="fa-solid fa-xmark"></i> Annuler</button>
      <button class="btn-start" onclick="markPreparing('${order.id}')"><i class="fa-solid fa-fire-burner"></i> Commencer</button>`;
  }
  if (order.status === "preparing") {
    return `${edit}
      <button class="btn-cancel" onclick="markCancelled('${order.id}')"><i class="fa-solid fa-xmark"></i> Annuler</button>
      <button class="btn-done" onclick="markDone('${order.id}')"><i class="fa-solid fa-check"></i> Terminé</button>`;
  }
  return '';
}

function tableBadge(order) {
  if (order.table_verified === true) {
    return '<span class="tbl-badge ok" title="Table confirmée par scan du QR"><i class="fa-solid fa-qrcode"></i> vérifiée</span>';
  }
  return '<span class="tbl-badge warn" title="Table non vérifiée (saisie manuelle ou lien)"><i class="fa-solid fa-triangle-exclamation"></i> non vérifiée</span>';
}

function renderOrders() {
  const posOrders = document.getElementById("posOrders");
  updateStats();

  const filtered = getFilteredOrders();

  if (!filtered.length) {
    const labels = { pending: "en attente", preparing: "en préparation", done: "terminées", cancelled: "annulées", all: "aujourd'hui" };
    posOrders.innerHTML = `<p class="empty-pos">Aucune commande ${labels[currentFilter]} pour aujourd'hui.</p>`;
    return;
  }

  posOrders.innerHTML = filtered.map(order => {
    const late = isActive(order.status) && isLate(order.created_at);
    const mins = minutesWaiting(order.created_at);
    const isNew = !knownIds.has(order.id) && order.status === "pending";
    const statusClass = order.status !== "pending" ? "order-" + order.status : "";

    return `
      <div class="order-card ${statusClass} ${late ? 'order-late' : ''} ${isNew ? 'new' : ''}" id="order-${order.id}">
        <div class="order-head">
          <h3><i class="fa-solid fa-utensils"></i> Table ${escapeHtml(order.table_number)} ${tableBadge(order)}</h3>
          <strong>${formatPrice(order.total)}</strong>
        </div>

        ${late ? `<div class="late-warning"><i class="fa-solid fa-triangle-exclamation"></i> Attend depuis ${mins} min</div>` : ''}
        ${getStatusLabel(order.status)}

        <ul class="order-items">
          ${order.items.map(item => `
            <li>${escapeHtml(item.name)} × ${item.qty} <span class="item-subtotal-pos">— ${formatPrice(item.price * item.qty)}</span></li>
          `).join("")}
        </ul>

        ${order.notes ? `<div class="order-note"><i class="fa-solid fa-pen"></i> ${escapeHtml(order.notes)}</div>` : ''}

        <div class="order-foot">
          <span class="order-time"><i class="fa-regular fa-clock"></i> ${formatTime(order.created_at)}</span>
          <div class="order-actions">${getActions(order)}</div>
        </div>
      </div>
    `;
  }).join("");
}



async function setStatus(id, status, confirmMsg) {
  if (confirmMsg && !confirm(confirmMsg)) return;
  try {
    await updateOrderStatus(id, status);
    await fetchAndRender();
  } catch (err) { console.error(err); alert("Action impossible. Réessayez."); }
}

const markPreparing = (id) => setStatus(id, "preparing");
const markDone = (id) => setStatus(id, "done");
const markCancelled = (id) => setStatus(id, "cancelled", "Annuler cette commande ?");



// ===== Edit an order (modify quantities / remove / add items) =====
let editingId = null;
let editItems = [];

function populateMenuDatalist() {
  const dl = document.getElementById("menuItemsList");
  if (!dl || typeof flatMenuItems !== "function") return;
  dl.innerHTML = flatMenuItems()
    .map(m => `<option value="${escapeHtml(m.name)}">${formatPrice(m.price)}</option>`)
    .join("");
}

function editTotal() {
  return editItems.reduce((sum, it) => sum + Number(it.price) * it.qty, 0);
}

function renderEditLines() {
  const wrap = document.getElementById("editLines");
  if (!wrap) return;
  if (!editItems.length) {
    wrap.innerHTML = `<p class="edit-empty">Aucun article — ajoutez-en un ci-dessous.</p>`;
  } else {
    wrap.innerHTML = editItems.map((it, i) => `
      <div class="edit-line">
        <div class="edit-line-info">
          <span class="edit-line-name">${escapeHtml(it.name)}</span>
          <span class="edit-line-price">${formatPrice(it.price)} × ${it.qty} = ${formatPrice(it.price * it.qty)}</span>
        </div>
        <div class="edit-qty">
          <button onclick="changeEditQty(${i}, -1)" aria-label="Moins">−</button>
          <span>${it.qty}</span>
          <button onclick="changeEditQty(${i}, 1)" aria-label="Plus">+</button>
        </div>
        <button class="edit-remove" onclick="removeEditLine(${i})" aria-label="Supprimer"><i class="fa-solid fa-trash"></i></button>
      </div>`).join("");
  }
  const t = document.getElementById("editTotal");
  if (t) t.textContent = formatPrice(editTotal());
}

function openEdit(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  editingId = id;
  editItems = (order.items || []).map(it => ({ name: it.name, price: Number(it.price), qty: it.qty }));
  const num = document.getElementById("editTableNum");
  if (num) num.textContent = order.table_number;
  renderEditLines();
  document.getElementById("editOverlay").hidden = false;
}

function closeEdit() {
  editingId = null;
  editItems = [];
  const ov = document.getElementById("editOverlay");
  if (ov) ov.hidden = true;
}

function changeEditQty(i, delta) {
  if (!editItems[i]) return;
  editItems[i].qty += delta;
  if (editItems[i].qty <= 0) editItems.splice(i, 1);
  renderEditLines();
}

function removeEditLine(i) {
  editItems.splice(i, 1);
  renderEditLines();
}

function addEditItem() {
  const input = document.getElementById("addItemInput");
  const name = input.value.trim();
  if (!name) return;
  const all = (typeof flatMenuItems === "function") ? flatMenuItems() : [];
  const match = all.find(m => m.name.toLowerCase() === name.toLowerCase());
  if (!match) { alert("Article introuvable — choisissez-en un dans la liste."); return; }
  const existing = editItems.find(it => it.name === match.name);
  if (existing) existing.qty += 1;
  else editItems.push({ name: match.name, price: Number(match.price), qty: 1 });
  input.value = "";
  renderEditLines();
}

async function saveEdit() {
  if (!editingId) return;
  if (!editItems.length) { alert("La commande doit contenir au moins un article (sinon, annulez-la)."); return; }
  try {
    await updateOrderItems(editingId, editItems, editTotal());
    closeEdit();
    await fetchAndRender();
  } catch (err) { console.error(err); alert("Enregistrement impossible. Réessayez."); }
}



async function fetchAndRender() {
  try {
    allOrders = await getOrders();
  } catch (err) {
    if (err.status === 401) { logout(); return; }
    console.error(err);
    return;
  }

  const pendingOrders = allOrders.filter(o => o.status === "pending" && isToday(o.created_at));
  const newOrders = pendingOrders.filter(o => !knownIds.has(o.id));
  if (newOrders.length > 0) {
    playSound();
    notifyNewOrders(newOrders);
  }
  pendingOrders.forEach(o => knownIds.add(o.id));

  renderOrders();
}

function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function notifyNewOrders(orders) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const title = orders.length === 1
      ? `Nouvelle commande — Table ${orders[0].table_number}`
      : `${orders.length} nouvelles commandes`;
    const body = orders.map(o => `Table ${o.table_number} · ${formatPrice(o.total)}`).join("\n");
    const n = new Notification(title, { body, icon: "icon-192.png", tag: "kz-order", renotify: true });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (e) {}
}

function requestNotifications() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}



document.addEventListener("DOMContentLoaded", async () => {
  if (!(await ensureAuth())) return;
  requestNotifications();
  populateMenuDatalist();
  startClock();
  fetchAndRender();
  setInterval(fetchAndRender, 5000);

  setInterval(renderOrders, 60000);
});
