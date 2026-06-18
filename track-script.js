const STEPS = [
  { key: "pending",   label: "Reçue",          icon: "fa-receipt" },
  { key: "preparing", label: "En préparation", icon: "fa-fire-burner" },
  { key: "done",      label: "Prête",          icon: "fa-bell-concierge" }
];

const FACES = [
  { rating: 1, emoji: "😡", label: "Mauvais" },
  { rating: 2, emoji: "🙁", label: "Moyen" },
  { rating: 3, emoji: "😐", label: "Correct" },
  { rating: 4, emoji: "🙂", label: "Bien" },
  { rating: 5, emoji: "😄", label: "Excellent" }
];

let lastStatus = null;
let pollTimer = null;

function getOrderId() {
  const fromUrl = new URLSearchParams(window.location.search).get("id");
  return fromUrl || localStorage.getItem("kz_last_order_id") || null;
}

function fmt(price) { return `${Number(price).toFixed(2)} DT`; }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fbKey(id) { return `kz_fb_${id}`; }

function renderNotFound() {
  document.getElementById("trackRoot").innerHTML = `
    <div class="track-empty">
      <i class="fa-solid fa-magnifying-glass"></i>
      <p>Commande introuvable.</p>
      <a href="index.html" class="btn-back-menu">Retour au menu</a>
    </div>`;
}

function stepperHTML(status) {
  if (status === "cancelled") {
    return `<div class="track-cancelled"><i class="fa-solid fa-circle-xmark"></i> Cette commande a été annulée.</div>`;
  }
  const activeIndex = Math.max(0, STEPS.findIndex(s => s.key === status));
  return `
    <div class="stepper">
      ${STEPS.map((s, i) => {
        const state = i < activeIndex ? "done" : (i === activeIndex ? "current" : "todo");
        return `
          <div class="step ${state}">
            <div class="step-dot"><i class="fa-solid ${s.icon}"></i></div>
            <span class="step-label">${s.label}</span>
          </div>
          ${i < STEPS.length - 1 ? `<div class="step-bar ${i < activeIndex ? "done" : ""}"></div>` : ""}`;
      }).join("")}
    </div>`;
}

function headlineHTML(status) {
  const map = {
    pending:   { t: "Commande reçue ✅",   s: "Le personnel a bien reçu votre commande." },
    preparing: { t: "En préparation 👨‍🍳", s: "Votre commande est en cuisine." },
    done:      { t: "C'est prêt ! 🔔",      s: "Votre commande est prête à être servie." },
    cancelled: { t: "Commande annulée",     s: "Contactez le personnel pour plus d'informations." }
  };
  const h = map[status] || map.pending;
  return `<div class="track-headline"><h2>${h.t}</h2><p>${h.s}</p></div>`;
}

function feedbackHTML(orderId) {
  if (localStorage.getItem(fbKey(orderId))) {
    return `<div class="feedback done"><i class="fa-solid fa-heart"></i> Merci pour votre retour !</div>`;
  }
  return `
    <div class="feedback" id="feedback">
      <h3>Comment évaluez-vous notre service ?</h3>
      <div class="faces">
        ${FACES.map(f => `
          <button class="face r${f.rating}" title="${f.label}" onclick="sendFeedback(${f.rating})">
            <span>${f.emoji}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

function render(order) {
  const itemsHTML = (order.items || []).map(it =>
    `<li><span>${escapeHtml(it.name)} × ${it.qty}</span><span>${fmt(it.price * it.qty)}</span></li>`
  ).join("");

  document.getElementById("trackRoot").innerHTML = `
    ${headlineHTML(order.status)}
    ${stepperHTML(order.status)}
    ${order.status === "done" ? feedbackHTML(order.id) : ""}
    <div class="track-card">
      <div class="track-row"><span>Table</span><strong>${escapeHtml(order.table_number)}</strong></div>
      <ul class="track-items">${itemsHTML}</ul>
      ${order.notes ? `<div class="track-note"><i class="fa-solid fa-pen"></i> ${escapeHtml(order.notes)}</div>` : ""}
      <div class="track-total"><span>Total</span><strong>${fmt(order.total)}</strong></div>
    </div>
    ${order.status === "done" || order.status === "cancelled" ? "" : `<p class="track-refresh"><i class="fa-solid fa-rotate"></i> Mise à jour automatique</p>`}`;
}

async function sendFeedback(rating) {
  const id = getOrderId();
  const box = document.getElementById("feedback");
  if (box) box.querySelectorAll("button").forEach(b => b.disabled = true);
  try {
    await submitFeedback(id, rating);
    localStorage.setItem(fbKey(id), String(rating));
    localStorage.removeItem("kz_last_order_id");
    if (box) box.outerHTML = `<div class="feedback done"><i class="fa-solid fa-heart"></i> Merci pour votre retour !</div>`;
  } catch (e) {
    if (box) box.querySelectorAll("button").forEach(b => b.disabled = false);
    alert("Impossible d'envoyer votre avis. Réessayez.");
  }
}

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(title, { body, icon: "icon-192.png", tag: "kz-track", renotify: true });
      n.onclick = () => { window.focus(); n.close(); };
    } catch (e) {}
  }
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function onStatusChange(status) {
  if (status === "preparing") { notify("KZ Café Lounge", "Votre commande est en préparation 👨‍🍳"); beep(); }
  else if (status === "done") { notify("KZ Café Lounge", "Votre commande est prête ! 🔔"); beep(); }
  else if (status === "cancelled") { notify("KZ Café Lounge", "Votre commande a été annulée."); }
}

async function refresh(id) {
  try {
    const order = await getOrderById(id);
    if (!order) { renderNotFound(); clearInterval(pollTimer); return; }
    if (lastStatus !== null && order.status !== lastStatus) onStatusChange(order.status);
    lastStatus = order.status;
    if (order.status === "cancelled") localStorage.removeItem("kz_last_order_id");
    render(order);
    if (order.status === "done" || order.status === "cancelled") clearInterval(pollTimer);
  } catch (e) {
    if (lastStatus === null) { renderNotFound(); clearInterval(pollTimer); }
  }
}

function requestNotifications() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  const ask = () => { Notification.requestPermission().catch(() => {}); window.removeEventListener("pointerdown", ask); };
  window.addEventListener("pointerdown", ask, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  const id = getOrderId();
  if (!id) { renderNotFound(); return; }
  requestNotifications();
  refresh(id);
  pollTimer = setInterval(() => refresh(id), 5000);
});
