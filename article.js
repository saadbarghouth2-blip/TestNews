// article.js — renders article.html?id=...
const STORAGE_KEY = "pulse_articles";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("yearArticle").textContent = new Date().getFullYear();
  setupThemeToggle();
  renderArticleFromId();
  setupBackToHome();
});

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderArticleFromId() {
  const id = getQueryParam("id");
  const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const art = store[id];
  const container = document.getElementById("articlePage");
  const suggestedList = document.getElementById("suggestedList");
  if (!art) {
    container.innerHTML = `<div style="padding:20px"><h2>Article not found</h2><p>The article may have expired or not been saved. Go back to <a href="index.html">home</a>.</p></div>`;
    return;
  }

  // build article HTML
  const title = escapeHtml(art.title || "Untitled");
  const source = escapeHtml(art.source || "");
  const published = art.published_at ? new Date(art.published_at).toLocaleString() : "";
  const author = escapeHtml(art.author || "");
  const image = art.image ? `<img class="article-image" src="${art.image}" alt="${title}">` : "";
  const description = art.description ? `<p class="article-body">${escapeHtml(art.description)}</p>` : `<p class="article-body">No description available.</p>`;
  // note: mediastack may not provide full article body — we display description & link
  const sourceLink = art.url ? `<a href="${art.url}" target="_blank" rel="noopener" class="small-btn">Open original</a>` : "";

  container.innerHTML = `
    <div class="article-header">
      <h1 class="article-title">${title}</h1>
      <div class="article-meta">${author}${author ? " • " : ""}${published} ${source ? " • " + source : ""}</div>
      ${image}
      ${description}
      <div class="article-controls">
        <button id="backHome" class="small-btn">← Back Home</button>
        ${sourceLink}
        <button id="shareBtn" class="small-btn">Share</button>
        <button id="saveBtn" class="small-btn">Save</button>
      </div>
    </div>
  `;

  // suggested: show up to 6 other stored articles (exclude current)
  const suggestions = Object.keys(store).filter(k => k !== id).slice(0, 6);
  suggestedList.innerHTML = suggestions.map(k => {
    const s = store[k];
    const thumb = s.image ? `<img src="${s.image}" alt="">` : `<div style="width:70px;height:52px;background:rgba(255,255,255,0.03);border-radius:6px"></div>`;
    const t = escapeHtml(truncate(s.title || "Untitled", 70));
    return `<a class="sugg-card" href="article.html?id=${encodeURIComponent(k)}">
      ${thumb}
      <div style="font-size:.95rem;color:var(--text)">${t}</div>
    </a>`;
  }).join("");

  // wire share + save
  document.getElementById("shareBtn").addEventListener("click", () => {
    const shareData = {
      title: art.title || "PulseNews article",
      text: art.description || "",
      url: art.url || window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(()=>{ alert('Share failed'); });
    } else {
      // fallback: open native share links
      const u = encodeURIComponent(shareData.url);
      const text = encodeURIComponent(shareData.title + " - " + (shareData.text || ""));
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank");
    }
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    let saved = JSON.parse(localStorage.getItem("pulse_saved") || "[]");
    if (!saved.includes(id)) {
      saved.unshift(id);
      localStorage.setItem("pulse_saved", JSON.stringify(saved));
      alert("Saved for later");
    } else {
      alert("Already saved");
    }
  });
}

function setupThemeToggle() {
  const t = document.getElementById("themeToggleArticle");
  t.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light");
    t.textContent = isLight ? "Dark" : "Light";
    t.setAttribute("aria-pressed", isLight.toString());
  });
}

function setupBackToHome(){
  // back home button in header nav is a normal link; also add listener for page button
  document.addEventListener("click", (e)=>{
    if(e.target && e.target.id === "backHome"){
      e.preventDefault();
      window.location.href = "index.html";
    }
  });
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function escapeHtml(s = "") {
  return ("" + s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function truncate(s = "", n = 70) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
