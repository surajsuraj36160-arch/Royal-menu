"use strict";
/* =====================================================
   ROYAL BITES  |  script.js
   1. Menu data (edit this to change the menu)
   2. Small helpers
   3. Menu page (cards, search, filters, sort)
   4. Dish detail panel (tabs, 3D, AR)
   5. Navigation and start-up
   ===================================================== */

/* ---------- 1. MENU DATA ----------
   To add a dish: copy one block, give it a new id (RB004...),
   change the text, and put its files in assets/images and assets/models.
   NOTE: nutrition, ingredients and allergens below are SAMPLE values. */
const DISHES = [
  { id: "RB001", slug: "burger", name: "Royal Classic Burger", category: "Burgers", veg: false, price: 249,
    time: 15, spicy: 2, serves: "1 person", emoji: "🍔",
    desc: "Juicy grilled patty with melted cheese, tomato and fresh cabbage in a soft toasted bun.",
    image: "assets/images/burger.jpg", model: "assets/models/burger.glb",
    available: true, popular: true, recommended: false,
    nutrition: { kcal: 620, protein: 28, carbs: 52, fat: 33, satFat: 9, fibre: 3, sugar: 8, sodium: 1100 },
    ingredients: { main: ["Grilled patty", "Bun", "Cheese slice", "Cabbage", "Tomato"],
                   sauces: ["Smoky mayo", "Peri-peri spice mix", "Black pepper"] },
    allergens: ["Gluten (wheat)", "Egg", "Milk", "Sesame"],
    prep: ["The patty is seasoned and grilled.", "The bun is toasted.", "The burger is assembled with cheese, tomato, cabbage and sauce."] },

  { id: "RB002", slug: "pizza", name: "Royal Cheese Pizza", category: "Pizza", veg: true, price: 349,
    time: 20, spicy: 1, serves: "1 to 2 people", emoji: "🍕",
    desc: "Hand-stretched crust with tomato sauce and a golden layer of melted mozzarella.",
    image: "assets/images/pizza.jpg", model: "assets/models/pizza.glb",
    available: true, popular: false, recommended: true,
    nutrition: { kcal: 540, protein: 22, carbs: 62, fat: 22, satFat: 10, fibre: 4, sugar: 7, sodium: 980 },
    ingredients: { main: ["Pizza dough", "Mozzarella", "Tomato sauce"],
                   sauces: ["Oregano", "Chilli flakes", "Garlic"] },
    allergens: ["Gluten (wheat)", "Milk"],
    prep: ["The dough is stretched by hand.", "It is topped with tomato sauce and mozzarella.", "The pizza is baked in a hot oven until the cheese turns golden."] },

  { id: "RB003", slug: "biryani", name: "Royal Chicken Biryani", category: "Biryani", veg: false, price: 329,
    time: 30, spicy: 3, serves: "1 to 2 people", emoji: "🍛",
    desc: "Long-grain basmati rice slow-cooked with tender marinated chicken, saffron and whole spices.",
    image: "assets/images/biryani.jpg", model: "assets/models/biryani.glb",
    available: true, popular: true, recommended: true,
    nutrition: { kcal: 720, protein: 34, carbs: 88, fat: 24, satFat: 8, fibre: 3, sugar: 4, sodium: 1250 },
    ingredients: { main: ["Basmati rice", "Chicken", "Fried onion", "Curd", "Ghee"],
                   sauces: ["Saffron", "Garam masala", "Cardamom", "Mint", "Red chilli"] },
    allergens: ["Milk (curd, ghee)"],
    prep: ["The chicken is marinated in curd and spices.", "Rice is part-cooked with whole spices.", "Rice and chicken are layered and sealed to cook slowly on 'dum'."] }
];

/* Typical adult daily values, only used to draw the small bars */
const DAILY = { kcal: 2000, protein: 50, carbs: 275, fat: 78, satFat: 20, fibre: 28, sugar: 50, sodium: 2300 };
/* [key in data, label to show, unit] */
const NUTRI = [["kcal", "Calories", "kcal"], ["protein", "Protein", "g"], ["carbs", "Carbohydrates", "g"],
               ["fat", "Total fat", "g"], ["satFat", "Saturated fat", "g"], ["fibre", "Fibre", "g"],
               ["sugar", "Sugar", "g"], ["sodium", "Sodium", "mg"]];

/* Set to false if a dish page should show ONLY that dish (no "You may also like") */
const SHOW_RELATED = true;

/* ---------- 2. HELPERS ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const state = { q: "", diet: "all", cat: "all", sort: "" };   // current search and filters

const spicy = n => n ? "🌶️".repeat(n) + " " + ["", "Mild", "Medium", "Hot"][n] : "Not spicy";
const dot = d => `<span class="dot ${d.veg ? "veg" : "nonveg"}" title="${d.veg ? "Vegetarian" : "Non-vegetarian"}"></span>`;
const tags = (list, cls = "") => list.map(t => `<span class="tag2 ${cls}">${t}</span>`).join("");

/* Food photo. If the image file is missing, it removes itself and the emoji shows instead. */
const photo = (d, cls = "") =>
  `<div class="thumb ${cls}"><span class="ph">${d.emoji}</span>
   <img src="${d.image}" alt="${d.name}" loading="lazy" decoding="async" width="400" height="300" onerror="this.remove()"></div>`;

/* One food card (menu, popular strip, "You may also like").
   The 3D and AR buttons open the dish and start that view. */
const card = d => {
  const tag = !d.available ? "Sold out" : d.recommended ? "Chef's pick" : d.popular ? "Popular" : "";
  return `
  <article class="card ${d.available ? "" : "off"}" data-id="${d.id}">
    <div class="media">${photo(d)}${tag ? `<span class="badge ${d.available ? "" : "no"}">${tag}</span>` : ""}</div>
    <div class="info">
      <div class="row">${dot(d)}<h3><button class="open" aria-label="Open ${d.name}">${d.name}</button></h3></div>
      <p class="desc">${d.desc}</p>
      <span class="price">₹${d.price}</span>
      <div class="acts"><button class="mini" data-act="3d">3D View</button><button class="mini fill" data-act="ar">AR View</button></div>
    </div>
  </article>`;
};

/* ---------- 3. MENU PAGE ---------- */
function filtered() {
  const list = DISHES.filter(d =>
    d.name.toLowerCase().includes(state.q) &&
    (state.diet === "all" || (state.diet === "veg") === d.veg) &&
    (state.cat === "all" || d.category === state.cat));
  if (state.sort) list.sort((a, b) => state.sort === "asc" ? a.price - b.price : b.price - a.price);
  return list;
}

function renderMenu() {
  const list = filtered();
  $("#grid").innerHTML = list.length
    ? list.map(card).join("")
    : `<div class="empty"><p>No dishes found. Try another name or category.</p><button class="btn ghost" id="resetBtn">Show all dishes</button></div>`;
  $("#status").textContent = list.length ? `${list.length} ${list.length === 1 ? "dish" : "dishes"}` : "";
  if (!list.length) $("#resetBtn").onclick = resetFilters;
  // The "Popular picks" strip only helps on a bigger menu, and only when nothing is filtered
  const filtering = state.q || state.diet !== "all" || state.cat !== "all" || state.sort;
  $("#popular").hidden = filtering || DISHES.length <= 4 || !DISHES.some(d => d.popular || d.recommended);
}

/* Filter buttons. items = [[value, label], ...], key = which part of `state` they change */
function chips(el, items, key) {
  el.innerHTML = items.map(([v, l]) =>
    `<button class="chip" data-v="${v}" aria-pressed="${state[key] === v}">${l}</button>`).join("");
  el.onclick = e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    state[key] = b.dataset.v;
    chips(el, items, key);
    renderMenu();
  };
}

/* ---------- 4. DISH DETAIL PANEL ---------- */
/* The five tabs. Each one returns the HTML for that tab. */
const TABS = {
  Overview: d => `<dl class="facts">${[
      ["Category", d.category], ["Diet", d.veg ? "Vegetarian" : "Non-vegetarian"],
      ["Preparation time", d.time + " min"], ["Spice level", spicy(d.spicy)],
      ["Serving size", d.serves], ["Availability", d.available ? "Available now" : "Currently unavailable"]
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`,

  Ingredients: d => `<h4>Main ingredients</h4>${tags(d.ingredients.main)}
    <h4>Sauces and spices</h4>${tags(d.ingredients.sauces)}
    <h4>Allergens</h4>${tags(d.allergens, "warn")}
    <h4>Diet</h4><p>${d.veg ? "Vegetarian. Contains no meat or fish." : "Non-vegetarian. Contains meat."}</p>
    <p class="note">Sample ingredient list. Replace it with your kitchen's real recipe.</p>`,

  Nutrition: d => `<p class="note demo">Demo values for illustration. They are not verified. Amounts are per serving.</p>
    <div class="nutri">${NUTRI.map(([k, label, unit]) => `
      <div class="n"><small>${label}</small><b>${d.nutrition[k]}<em>${unit}</em></b>
      <span class="meter"><span style="width:${Math.min(100, d.nutrition[k] / DAILY[k] * 100)}%"></span></span></div>`).join("")}</div>
    <p class="note">Bars show the share of a typical adult daily value.</p>`,

  Allergens: d => `<p>This dish may contain:</p>${tags(d.allergens, "warn")}
    <p class="note">Sample data. Please confirm allergens with the restaurant before ordering.</p>`,

  Preparation: d => `<p>Prepared fresh and ready in about ${d.time} minutes.</p>
    <ol class="steps">${d.prep.map(s => `<li>${s}</li>`).join("")}</ol>`
};

function showDetail(d) {
  const el = $("#detail"), m = d.nutrition;
  const related = [...DISHES.filter(x => x !== d && x.category === d.category),
                   ...DISHES.filter(x => x !== d && x.category !== d.category)].slice(0, 2);
  const quick = [["kcal", "Calories", " kcal"], ["protein", "Protein", " g"], ["carbs", "Carbs", " g"], ["fat", "Fat", " g"]];

  el.innerHTML = `
    <div class="sheet-bar"><button class="back" id="closeBtn">← Back to Full Menu</button></div>
    <div class="wrap">
      ${photo(d, "big")}
      <div class="row title">${dot(d)}<h2>${d.name}</h2></div>
      <p class="price big">₹${d.price} <span class="tag ${d.available ? "ok" : "no"}">${d.available ? "Available" : "Unavailable"}</span></p>
      <p class="lead">${d.desc}</p>
      <p class="ing"><b>Main ingredients:</b> ${d.ingredients.main.join(", ")}</p>
      <div class="quick">${quick.map(([k, l, u]) => `<div><b>${m[k]}${u}</b><small>${l}</small></div>`).join("")}</div>
      <p class="note">Sample nutrition values. Full details are in the Nutrition tab.</p>

      <div class="actions">
        <button class="btn gold" id="btn3d">VIEW IN 3D</button>
        <button class="btn ghost" id="btnAr">VIEW IN YOUR SPACE – AR</button>
      </div>

      <div class="viewer" id="viewerBox" hidden>
        <model-viewer id="mv" alt="3D model of ${d.name}" camera-controls touch-action="pan-y" auto-rotate
          shadow-intensity="1" ar ar-modes="scene-viewer webxr quick-look" ar-scale="fixed" loading="eager">
          <button slot="ar-button" hidden></button>
        </model-viewer>
        <div class="vbar"><button class="vbtn" id="closeViewer" aria-label="Close 3D view">✕ Close</button></div>
        <div class="zoom"><button class="vbtn" id="zIn" aria-label="Zoom in">+</button><button class="vbtn" id="zOut" aria-label="Zoom out">−</button></div>
        <p class="hint">Drag to rotate, pinch to zoom</p>
        <div class="loader" id="loader"><span class="meter"><span id="bar"></span></span><small>Loading 3D model…</small></div>
        <p class="fallback" id="fallback" hidden>This 3D model could not be loaded. Check your internet connection or try again later.</p>
      </div>
      <p class="note" id="arMsg" role="status"></p>

      <div class="tabs" id="tabs" role="tablist">
        ${Object.keys(TABS).map(t => `<button role="tab" data-t="${t}">${t}</button>`).join("")}
      </div>
      <div class="panel" id="panel" role="tabpanel"></div>

      ${SHOW_RELATED ? `<h3 class="sub">You may also like</h3><div class="strip">${related.map(card).join("")}</div>` : ""}
    </div>`;

  el.hidden = false;
  el.scrollTop = 0;
  document.body.classList.add("lock");

  $("#closeBtn").onclick = closeDetail;
  $("#btn3d").onclick = () => open3D(d);
  $("#btnAr").onclick = () => openAR(d);
  $("#closeViewer").onclick = () => { $("#viewerBox").hidden = true; };     // model stays loaded
  $("#zIn").onclick = () => { const v = $("#mv"); if (v.zoom) v.zoom(1); };
  $("#zOut").onclick = () => { const v = $("#mv"); if (v.zoom) v.zoom(-1); };

  const pick = name => {
    $("#tabs").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.t === name));
    $("#panel").innerHTML = TABS[name](d);
  };
  $("#tabs").onclick = e => { const b = e.target.closest("button"); if (b) pick(b.dataset.t); };
  pick("Overview");

  // A card's 3D / AR button opens the dish and then starts that view
  const act = state.act; state.act = "";
  if (act === "3d") open3D(d); else if (act === "ar") openAR(d);
}

function hideDetail() {
  const el = $("#detail");
  el.hidden = true;
  el.innerHTML = "";                       // removing the viewer frees phone memory
  document.body.classList.remove("lock");
}
function closeDetail() { go(location.pathname); $("#menu").scrollIntoView(); }   // back to the full menu

/* Open the 3D viewer and start loading the model (only the first time) */
function open3D(d) {
  const box = $("#viewerBox"), mv = $("#mv");
  box.hidden = false;
  if (!mv.dataset.started) {
    mv.dataset.started = "1";
    const fail = why => {
      $("#loader").hidden = true; mv.hidden = true;
      $("#fallback").hidden = false;
      if (why) $("#fallback").textContent = why;      // shows the real reason on screen
    };
    if (location.protocol === "file:") return fail("3D does not work when the page is opened as a plain file. Use the Acode preview button or the GitHub Pages link.");
    if (!customElements.get("model-viewer")) return fail("The 3D viewer could not start. Check your internet connection and refresh the page.");
    mv.addEventListener("progress", e => { $("#bar").style.width = e.detail.totalProgress * 100 + "%"; });
    mv.addEventListener("load", () => {
      $("#loader").hidden = true;
      if (mv.dataset.wantAr) $("#arMsg").textContent = "Model ready. Tap the AR button again to place it on your table.";
    });
    mv.addEventListener("ar-status", e => {                       // AR started but then failed
      if (e.detail.status === "failed") $("#arMsg").textContent = "AR could not start. Use Chrome, update Google Play Services for AR, and try again in good light.";
    });
    mv.addEventListener("error", () =>                              // find out WHY it failed
      fetch(d.model, { method: "HEAD" })
        .then(r => fail(r.ok ? "The file " + d.model + " was found, but the browser could not read it."
                             : "File not found (" + r.status + "): " + d.model + ". Check the folder and the exact file name."))
        .catch(() => fail("Could not reach " + d.model + ".")));
    mv.src = d.model;
  }
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* AR only starts when the model is loaded AND the phone supports it. No fake buttons. */
function openAR(d) {
  const mv = $("#mv"), msg = $("#arMsg");
  open3D(d);
  if (!$("#fallback").hidden) { msg.textContent = "AR is unavailable because the 3D model could not be loaded."; return; }
  if (!mv.loaded) { mv.dataset.wantAr = "1"; msg.textContent = "The model is still loading. Tap the AR button again in a moment."; return; }
  if (mv.canActivateAR) { msg.textContent = ""; mv.activateAR(); }
  else msg.textContent = "AR is not supported on this device or browser. Try Chrome on an Android phone with ARCore, or use the 3D view.";
}

/* ---------- URL ROUTING ----------
   /                  -> full menu
   /?dish=biryani     -> only the biryani page   (also burger, pizza; a dish id like RB003 works too)
   /?dish=anything    -> friendly message + full menu
   Everything happens in this one page. No separate HTML files. */
function go(url) {
  try { history.pushState({}, "", url); } catch (e) { /* some browsers block this on file:// */ }
  route(url.includes("?") ? url.slice(url.indexOf("?")) : "");
}
function openDish(id) {
  const d = DISHES.find(x => x.id === id);
  if (d) go("?dish=" + d.slug);
}
function route(search = location.search) {
  const q = new URLSearchParams(search).get("dish");
  const note = $("#notice");
  note.hidden = true;
  document.title = "Royal Bites | 3D and AR Menu";
  if (q === null) return hideDetail();                              // "/" -> full menu

  const key = q.trim().toLowerCase();
  const d = DISHES.find(x => x.slug === key || x.id.toLowerCase() === key);
  if (d) { document.title = d.name + " | Royal Bites"; return showDetail(d); }

  hideDetail();                                                     // unknown dish name
  note.hidden = false;
  try { history.replaceState({}, "", location.pathname); } catch (e) {}
  $("#menu").scrollIntoView();
}

/* ---------- 5. NAVIGATION AND START-UP ---------- */
const ORDER = ["Biryani", "Pizza", "Burgers", "Starters", "Desserts", "Drinks"];   // category order

/* Category buttons only show categories that have at least one dish */
function buildChips() {
  const have = [...new Set(DISHES.map(d => d.category))];
  const cats = [...ORDER.filter(c => have.includes(c)), ...have.filter(c => !ORDER.includes(c))];
  chips($("#dietChips"), [["all", "All"], ["veg", "Veg"], ["nonveg", "Non-veg"]], "diet");
  chips($("#categories"), [["all", "All Items"], ...cats.map(c => [c, c])], "cat");
}

function resetFilters() {
  Object.assign(state, { q: "", diet: "all", cat: "all", sort: "" });
  $("#search").value = ""; $("#sort").value = ""; $("#clearBtn").hidden = true;
  buildChips();
  renderMenu();
}

function setupNav() {
  const links = $("#links"), burger = $("#burgerBtn"), toTop = $("#toTop");
  const closeNav = () => { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); };

  burger.onclick = () => burger.setAttribute("aria-expanded", links.classList.toggle("open"));
  links.onclick = e => { if (e.target.closest("a")) closeNav(); };
  $("#searchBtn").onclick = () => {
    closeNav();
    $("#menu").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("#search").focus(), 450);
  };

  addEventListener("scroll", () => { toTop.hidden = scrollY < 600; }, { passive: true });
  toTop.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

  // Tap a card to open it. The 3D / AR buttons also tell the dish page what to start.
  document.addEventListener("click", e => {
    const c = e.target.closest(".card");
    if (!c) return;
    const b = e.target.closest("[data-act]");
    state.act = b ? b.dataset.act : "";
    openDish(c.dataset.id);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#detail").hidden) closeDetail(); });
}

function init() {
  try {
    buildChips();
    const input = $("#search"), clear = $("#clearBtn");
    input.oninput = () => { state.q = input.value.trim().toLowerCase(); clear.hidden = !input.value; renderMenu(); };
    clear.onclick = () => { input.value = ""; input.oninput(); input.focus(); };
    $("#sort").onchange = e => { state.sort = e.target.value; renderMenu(); };

    $("#popularList").innerHTML = DISHES.filter(d => d.popular || d.recommended).map(card).join("");
    renderMenu();
    setupNav();
    addEventListener("popstate", () => route());                    // browser back / forward buttons

    // Older links (?id=RB001 or #RB001) are turned into the new ?dish= form
    const old = DISHES.find(x => x.id.toLowerCase() === (new URLSearchParams(location.search).get("id") || location.hash.slice(1)).toLowerCase());
    if (old && !new URLSearchParams(location.search).has("dish")) {
      try { history.replaceState({}, "", location.pathname + "?dish=" + old.slug); } catch (e) {}
      route("?dish=" + old.slug);
    } else route();
  } catch (err) {
    console.error(err);
    $("#status").textContent = "Sorry, the menu could not be loaded. Please refresh the page.";
  }
}
init();
