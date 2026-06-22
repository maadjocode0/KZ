// Menu-data integrity test — run:  node test.mjs
// No framework on purpose (this is a zero-build project). Guards the #1 bug
// class: two items sharing a display name merge in the cart. Also checks prices,
// structure, and unique category slugs. Wire into a pre-deploy check if you like.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const code = readFileSync(new URL("./menu-data.js", import.meta.url), "utf8");
const exportAll = "return { MENU_DATA, flatMenuItems, slugify, formatPrice, baseName, itemCategory };";
const { MENU_DATA, flatMenuItems, slugify, formatPrice } = new Function(code + exportAll)();

let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

// 1) Structure + valid prices
ok(Array.isArray(MENU_DATA) && MENU_DATA.length > 0, "MENU_DATA is a non-empty array");
for (const block of MENU_DATA) {
  ok(typeof block.category === "string" && block.category.trim(), "category has a name");
  ok(Array.isArray(block.items) && block.items.length > 0, `${block.category}: has items`);
  for (const it of block.items) {
    ok(typeof it.name === "string" && it.name.trim(), `${block.category}: item has a name`);
    if (it.variants) {
      ok(it.variants.length > 0, `${it.name}: variants non-empty`);
      for (const v of it.variants) {
        ok(v.label && typeof v.price === "number" && v.price > 0, `${it.name} (${v.label}): valid variant`);
      }
    } else {
      ok(typeof it.price === "number" && it.price > 0, `${it.name}: valid price`);
    }
  }
}

// 2) Unique display names — the cart keys lines by name, so dupes would merge
const flat = flatMenuItems();
const names = flat.map((i) => i.name);
const dupNames = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
ok(dupNames.length === 0, `duplicate cart names: ${dupNames.join(", ")}`);

// 3) Unique category slugs — used for anchor ids / scroll-spy
const slugs = MENU_DATA.map((b) => slugify(b.category));
const dupSlugs = [...new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))];
ok(dupSlugs.length === 0, `duplicate category slugs: ${dupSlugs.join(", ")}`);

// 4) formatPrice sanity
ok(formatPrice(4) === "4.00 DT", "formatPrice -> '4.00 DT'");

console.log(`✓ ${checks} checks passed — ${MENU_DATA.length} categories, ${flat.length} orderable lines.`);
