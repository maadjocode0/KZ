

let overrides = {};
let catImages = {};

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
function jsStr(str) { return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }

function flash(msg, isError) {
  const el = document.getElementById("saveStatus");
  el.textContent = msg;
  el.className = "save-status show" + (isError ? " error" : "");
  clearTimeout(flash._t);
  flash._t = setTimeout(() => { el.className = "save-status"; }, 2200);
}

async function loadData() {
  overrides = {}; catImages = {};
  try {
    const rows = await getMenuItems();
    rows.forEach(r => { overrides[r.name] = r; });
  } catch (e) {
    if (e.status === 401) { logout(); return; }
    flash("Table menu_items absente — lancez le SQL", true);
  }
  try {
    const imgs = await getCategoryImages();
    imgs.forEach(r => { if (r.image_url) catImages[r.category] = r.image_url; });
  } catch (e) {
    if (e.status === 401) { logout(); return; }

  }
}

function currentCatImage(cat) {
  return catImages[cat] || CATEGORY_PLACEHOLDERS[cat] || "";
}

function catPhotoHTML(cat) {
  const c = jsStr(cat);
  const custom = catImages[cat] || "";
  return `
    <div class="cat-photo">
      <img class="cat-thumb" src="${escapeHtml(currentCatImage(cat))}" alt="" loading="lazy"
           onerror="this.classList.add('broken')" />
      ${custom ? `<span class="cat-photo-tag">perso</span>` : ``}
    </div>
    <div class="cat-photo-body">
      <h2>${escapeHtml(cat)}</h2>
      <div class="cat-photo-actions">
        <label class="photo-btn">
          <input type="file" accept="image/*" hidden onchange="onPhotoFile(this, '${c}')" />
          <i class="fa-solid fa-camera"></i> Changer la photo
        </label>
        <input type="text" class="cat-url" placeholder="ou coller un lien d'image…"
               value="${escapeHtml(custom)}" onchange="onPhotoUrl(this, '${c}')" />
        <button class="photo-reset" title="Photo par défaut" onclick="onPhotoReset('${c}')">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>`;
}

function render() {
  const root = document.getElementById("adminList");
  const items = flatMenuItems();

  const byCat = new Map();
  items.forEach(it => {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category).push(it);
  });

  root.innerHTML = [...byCat.entries()].map(([cat, list]) => `
    <section class="admin-cat" data-cat="${escapeHtml(cat)}">
      <div class="admin-cat-head">${catPhotoHTML(cat)}</div>
      <div class="admin-rows">
        ${list.map(it => {
          const o = overrides[it.name] || {};
          const available = o.available !== false;
          const priceVal = (o.price_override != null) ? o.price_override : "";
          return `
            <div class="admin-row ${available ? "" : "is-out"}" data-name="${escapeHtml(it.name)}">
              <div class="admin-row-name">
                <span class="name">${escapeHtml(it.name)}</span>
                <span class="base-price">défaut ${formatPrice(it.price)}</span>
              </div>
              <div class="admin-row-controls">
                <div class="price-field">
                  <input type="number" step="0.5" min="0" inputmode="decimal"
                    value="${priceVal}" placeholder="${Number(it.price).toFixed(2)}"
                    data-name="${escapeHtml(it.name)}" onchange="onPriceChange(this)" />
                  <span>DT</span>
                </div>
                <label class="switch" title="Disponible / Épuisé">
                  <input type="checkbox" ${available ? "checked" : ""}
                    data-name="${escapeHtml(it.name)}" onchange="onToggle(this)" />
                  <span class="slider"></span>
                </label>
                <span class="state-label">${available ? "Dispo" : "Épuisé"}</span>
              </div>
            </div>`;
        }).join("")}
      </div>
    </section>
  `).join("");
}

function catSection(cat) {
  return [...document.querySelectorAll(".admin-cat")].find(s => s.dataset.cat === cat);
}

function refreshCatPhoto(cat) {
  const section = catSection(cat);
  if (!section) return;
  const img = section.querySelector(".cat-thumb");
  if (img) { img.classList.remove("broken"); img.src = currentCatImage(cat); }
  const url = section.querySelector(".cat-url");
  if (url) url.value = catImages[cat] || "";
  const tag = section.querySelector(".cat-photo-tag");
  if (catImages[cat] && !tag) {
    const span = document.createElement("span");
    span.className = "cat-photo-tag"; span.textContent = "perso";
    section.querySelector(".cat-photo").appendChild(span);
  } else if (!catImages[cat] && tag) {
    tag.remove();
  }
}

function resizeImage(file, maxW = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

async function onPhotoFile(input, cat) {
  const file = input.files && input.files[0];
  if (!file) return;
  flash("Envoi de la photo…");
  try {
    const blob = await resizeImage(file);
    const url = await uploadPhoto(blob, "jpg");
    await upsertCategoryImage(cat, url);
    catImages[cat] = url;
    refreshCatPhoto(cat);
    flash(`Photo mise à jour : ${cat}`);
  } catch (e) {
    if (e.status === 401) return logout();
    flash("Échec de l'envoi (table/bucket manquant ?)", true);
  } finally {
    input.value = "";
  }
}

async function onPhotoUrl(input, cat) {
  const url = input.value.trim();
  try {
    await upsertCategoryImage(cat, url || null);
    if (url) catImages[cat] = url; else delete catImages[cat];
    refreshCatPhoto(cat);
    flash(url ? `Photo mise à jour : ${cat}` : `Photo par défaut : ${cat}`);
  } catch (e) {
    if (e.status === 401) return logout();
    flash("Échec de l'enregistrement", true);
  }
}

async function onPhotoReset(cat) {
  try {
    await upsertCategoryImage(cat, null);
    delete catImages[cat];
    refreshCatPhoto(cat);
    flash(`Photo par défaut : ${cat}`);
  } catch (e) {
    if (e.status === 401) return logout();
    flash("Échec de l'enregistrement", true);
  }
}

async function onToggle(input) {
  const name = input.dataset.name;
  const available = input.checked;
  const row = input.closest(".admin-row");
  row.classList.toggle("is-out", !available);
  row.querySelector(".state-label").textContent = available ? "Dispo" : "Épuisé";
  overrides[name] = { ...(overrides[name] || {}), name, available };
  try {
    await upsertMenuItem({ name, available });
    flash(available ? `${name} : disponible` : `${name} : épuisé`);
  } catch (e) {
    if (e.status === 401) return logout();
    flash("Échec de l'enregistrement", true);
  }
}

async function onPriceChange(input) {
  const name = input.dataset.name;
  const raw = input.value.trim();
  const price_override = raw === "" ? null : Number(raw);
  if (raw !== "" && (isNaN(price_override) || price_override < 0)) {
    flash("Prix invalide", true);
    return;
  }
  overrides[name] = { ...(overrides[name] || {}), name, price_override };
  try {
    await upsertMenuItem({ name, price_override });
    flash(price_override == null ? `${name} : prix par défaut` : `${name} : ${formatPrice(price_override)}`);
  } catch (e) {
    if (e.status === 401) return logout();
    flash("Échec de l'enregistrement", true);
  }
}

function setupSearch() {
  const input = document.getElementById("adminSearch");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll(".admin-cat").forEach(cat => {
      const catMatch = cat.dataset.cat.toLowerCase().includes(q);
      let any = catMatch;
      cat.querySelectorAll(".admin-row").forEach(row => {
        const match = catMatch || row.dataset.name.toLowerCase().includes(q);
        row.style.display = match ? "" : "none";
        if (match) any = true;
      });
      cat.style.display = any ? "" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!(await ensureAuth())) return;
  await loadData();
  render();
  setupSearch();
});
