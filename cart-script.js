const CART_KEY = "kz_cart";
const TABLE_KEY = "kz_table";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getTable() {
  return localStorage.getItem(TABLE_KEY) || "";
}

const VERIFIED_KEY = "kz_table_verified";

function setTable(table, verified) {
  localStorage.setItem(TABLE_KEY, table);
  localStorage.setItem(VERIFIED_KEY, verified ? "1" : "0");
}

function isTableVerified() {
  return localStorage.getItem(VERIFIED_KEY) === "1";
}

function showTable(table) {
  document.getElementById("tableDisplay").style.display = "block";
  document.getElementById("tableNumber").textContent = table;
  const tag = document.getElementById("tableVerifiedTag");
  if (tag) {
    if (isTableVerified()) { tag.textContent = "✓ vérifiée"; tag.className = "tag-verified"; }
    else { tag.textContent = "non vérifiée"; tag.className = "tag-unverified"; }
  }
  document.getElementById("orderBtn").disabled = false;
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
}

function updateQty(index, delta) {
  const cart = getCart();
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  setCart(cart);
  renderCart();
}

function renderCart() {
  const cart = getCart();
  const cartItems = document.getElementById("cartItems");
  const cartSummary = document.getElementById("cartSummary");
  const cartEmpty = document.getElementById("cartEmpty");
  const orderBtn = document.getElementById("orderBtn");

  if (!cart.length) {
    cartEmpty.style.display = "block";
    cartSummary.style.display = "none";
    return;
  }

  cartEmpty.style.display = "none";
  cartSummary.style.display = "block";

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById("cartTotal").textContent = formatPrice(total);

  cartItems.innerHTML = `
    <div class="cart-list">
      ${cart.map((item, i) => `
        <div class="cart-item">
          <div class="cart-item-left">
            <h4>${item.name}</h4>
            <p>${formatPrice(item.price)} / unité</p>
          </div>
          <div class="cart-item-right">
            <div class="qty-controls">
              <button class="qty-btn" onclick="updateQty(${i}, -1)">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty(${i}, 1)">+</button>
            </div>
            <span class="item-subtotal">${formatPrice(item.price * item.qty)}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;


  const table = getTable();
  if (table) showTable(table);
}

function setTableManually() {
  const input = document.getElementById("tableInput");
  const val = input.value.trim();
  if (!val || isNaN(val) || Number(val) < 1) {
    input.style.borderColor = "red";
    return;
  }
  input.style.borderColor = "";
  setTable(val, false);
  showTable(val);
}
const MAX_QTY_PER_ITEM = 20;
const MAX_ITEMS_IN_CART = 15;
const ORDER_COOLDOWN_MS = 30000;

function validateOrder(cart, table) {
  if (!cart.length) return "Panier vide.";
  if (cart.length > MAX_ITEMS_IN_CART) return "Trop d'articles différents.";
  if (cart.some(i => i.qty > MAX_QTY_PER_ITEM)) return "Quantité maximale dépassée.";
  if (!table || isNaN(table) || Number(table) < 1 || Number(table) > 50)
    return "Numéro de table invalide.";

  const lastOrder = localStorage.getItem("kz_last_order");
  if (lastOrder && Date.now() - Number(lastOrder) < ORDER_COOLDOWN_MS)
    return "Commande déjà envoyée. Attendez 30 secondes.";

  return null;
}
async function submitOrder() {
  const cart = getCart();
  const table = getTable();
  const error = validateOrder(cart, table);
  if (error) { alert(error); return; }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const note = (document.getElementById("orderNote")?.value || "").trim();
  const orderBtn = document.getElementById("orderBtn");
  orderBtn.disabled = true;
  orderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';

  try {
    const order = await createOrder(table, cart, total, note, isTableVerified());
    setCart([]);
    localStorage.removeItem(TABLE_KEY);
    localStorage.removeItem(VERIFIED_KEY);
    localStorage.setItem("kz_last_order", Date.now());

    const trackLink = document.getElementById("trackLink");
    if (order && order.id) {
      localStorage.setItem("kz_last_order_id", order.id);
      trackLink.href = `track.html?id=${order.id}`;
    } else {
      trackLink.style.display = "none";
    }

    document.getElementById("cartItems").innerHTML = "";
    document.querySelector(".summary-card").style.display = "none";
    document.querySelector(".table-section").style.display = "none";
    document.querySelector(".note-section").style.display = "none";
    document.getElementById("orderBtn").style.display = "none";
    document.getElementById("orderSuccess").style.display = "block";
  } catch (err) {
    orderBtn.disabled = false;
    orderBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmer la commande';
    const msg = !navigator.onLine
      ? "Pas de connexion internet. Vérifiez votre réseau et réessayez."
      : "Impossible d'envoyer la commande. Vérifiez votre connexion et réessayez.";
    alert(msg);
    console.error("Échec de l'envoi de la commande:", err);
  }
}


function checkURLTable() {
  const params = new URLSearchParams(window.location.search);
  const table = params.get("table");
  if (table) setTable(table, false);
}

document.addEventListener("DOMContentLoaded", () => {
  checkURLTable();
  renderCart();
});

let scanStream = null;
let scanActive = false;

function parseTableFromQR(data) {
  try {
    const u = new URL(data);
    const t = u.searchParams.get("table");
    if (t && /^\d+$/.test(t) && Number(t) >= 1 && Number(t) <= 50) return String(Number(t));
  } catch (e) {
    const n = String(data).trim();
    if (/^\d+$/.test(n) && Number(n) >= 1 && Number(n) <= 50) return n;
  }
  return null;
}

async function startScan() {
  const overlay = document.getElementById("scanOverlay");
  const video = document.getElementById("scanVideo");
  const status = document.getElementById("scanStatus");
  if (typeof jsQR === "undefined") { alert("Scanner indisponible. Utilisez la saisie manuelle."); return; }
  overlay.style.display = "flex";
  status.textContent = "Démarrage de la caméra…";
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = scanStream;
    await video.play();
    scanActive = true;
    status.textContent = "Visez le QR code de votre table.";
    requestAnimationFrame(scanTick);
  } catch (err) {
    scanActive = false;
    status.textContent = "Accès caméra refusé. Fermez et saisissez le numéro manuellement.";
  }
}

function stopScan() {
  scanActive = false;
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  const video = document.getElementById("scanVideo");
  if (video) video.srcObject = null;
  const overlay = document.getElementById("scanOverlay");
  if (overlay) overlay.style.display = "none";
}

function scanTick() {
  if (!scanActive) return;
  const video = document.getElementById("scanVideo");
  const canvas = document.getElementById("scanCanvas");
  const status = document.getElementById("scanStatus");
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
    if (code && code.data) {
      const table = parseTableFromQR(code.data);
      if (table) { onScanned(table); return; }
      status.textContent = "QR non reconnu. Visez le QR de votre table KZ.";
    }
  }
  requestAnimationFrame(scanTick);
}

function onScanned(table) {
  setTable(table, true);
  stopScan();
  showTable(table);
}