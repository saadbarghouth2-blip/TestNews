// script.js — Home & categories
// Replace API_KEY with your Mediastack key if needed
const API_KEY = "9bd3212352b5272b3ebc0c0a5609e135";

// mapping: sectionId -> category param
const CATEGORIES = {
  latest: { param: "general", el: "latestNews" },
  sports: { param: "sports", el: "sportsNews" },
  business: { param: "business", el: "businessNews" },
  tech: { param: "technology", el: "techNews" },
  wars: { param: "politics", el: "warsNews" }
};

// store articles globally for linking to article page
// structure in localStorage: pulse_articles = { id1: {...}, id2: {...} }
const STORAGE_KEY = "pulse_articles";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  setupUI();
  // load each category; include an older batch using offset to fill sections
  Object.keys(CATEGORIES).forEach((k) => {
    const cat = CATEGORIES[k];
    loadCategory(cat.param, cat.el, 0);    // recent
    loadCategory(cat.param, cat.el, 30);   // older (offset)
  });
});

/* ---------- LOAD & RENDER ---------- */
async function loadCategory(category, elementId, offset = 0) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const loadingNote = document.createElement("div");
  loadingNote.style.opacity = 0.7;
  loadingNote.textContent = offset === 0 ? "Loading..." : "Loading older...";
  el.appendChild(loadingNote);

  try {
    // Mediastack supports offset param
    const res = await fetch(
      `https://api.mediastack.com/v1/news?access_key=${API_KEY}&languages=en&limit=12&offset=${offset}&categories=${encodeURIComponent(category)}`
    );
    const data = await res.json();
    const items = data.data || [];

    // remove the loading note
    el.removeChild(loadingNote);

    if (!items.length) {
      // nothing to append
      return;
    }

    // save each article with a generated id into localStorage map
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const html = items.map((a) => {
      const id = generateId(a);
      if (!existing[id]) existing[id] = a;
      return articleCardHtml(a, id);
    }).join("");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    // append (keep sections filled)
    el.insertAdjacentHTML("beforeend", html);
  } catch (err) {
    console.error("loadCategory error:", err);
    if (loadingNote && loadingNote.parentNode) loadingNote.textContent = "Failed to load.";
  }
}

function articleCardHtml(a, id) {
  const img = a.image ? `<img src="${a.image}" loading="lazy" alt="${escapeHtml(a.title)}">` : `<div style="height:150px;border-radius:8px;background:rgba(255,255,255,0.02)"></div>`;
  const title = escapeHtml(a.title || "Untitled");
  const desc = a.description ? `<p>${escapeHtml(truncate(a.description, 140))}</p>` : "";
  // clicking goes to article.html?id=ID
  return `
    <article class="news-card" data-id="${id}">
      <a class="card-link" href="article.html?id=${encodeURIComponent(id)}" aria-label="${title}">
        ${img}
        <h3>${title}</h3>
        ${desc}
        <div style="margin-top:10px;color:var(--muted);font-size:.9rem">${escapeHtml(a.source || "")}</div>
      </a>
    </article>
  `;
}

/* ---------- UI ---------- */
function setupUI() {
  // theme toggle
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light");
    themeBtn.textContent = isLight ? "Dark" : "Light";
    themeBtn.setAttribute("aria-pressed", (isLight).toString());
  });

  // back to top
  const backTop = document.getElementById("backTop");
  window.addEventListener("scroll", () => {
    backTop.style.display = window.scrollY > 300 ? "block" : "none";
  });
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // smooth nav
  document.querySelectorAll(".nav a").forEach((a) => {
    a.addEventListener("click", (ev) => {
      // if it's a local anchor, smooth scroll
      const href = a.getAttribute("href");
      if (href && href.startsWith("#")) {
        ev.preventDefault();
        const tgt = document.querySelector(href);
        if (tgt) {
          const y = tgt.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
    });
  });
}

/* ---------- Helpers ---------- */
function generateId(a) {
  // try to create stable id from url or title + date
  const base = a.url || (a.title || "") + (a.published_at || "");
  // simple hash
  let h = 0, i = 0;
  const s = base || Math.random().toString(36).slice(2);
  for (i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return "art_" + Math.abs(h);
}
function escapeHtml(s = "") {
  return ("" + s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function truncate(s = "", n = 120) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
