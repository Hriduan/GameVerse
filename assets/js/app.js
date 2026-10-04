(() => {
  const games = window.GAMEVERSE_GAMES || [];
  const byId = id => games.find(game => game.id === id);
  const path = location.pathname.split("/").pop() || "index.html";

  const icon = (name) => ({
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>'
  }[name]);

  function layout() {
    const header = document.querySelector("[data-header]");
    const footer = document.querySelector("[data-footer]");
    if (header) header.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header">
        <a class="brand" href="index.html" aria-label="GameVerse home"><span class="brand-mark">G</span><span>Game<span>Verse</span></span></a>
        <nav class="desktop-nav" aria-label="Main navigation">
          <a class="${path === "index.html" ? "active" : ""}" href="index.html">Home</a>
          <a class="${path === "games.html" || path === "detail.html" || path === "play.html" ? "active" : ""}" href="games.html">Games</a>
          <a class="${path === "about.html" ? "active" : ""}" href="about.html">About</a>
          <a class="${path === "support.html" ? "active" : ""}" href="support.html">Support</a>
        </nav>
        <div class="header-actions"><a class="button button-small" href="games.html">${icon("play")} Play now</a>
        <button class="menu-button" data-menu aria-label="Open menu">${icon("menu")}</button></div>
      </header>
      <nav class="mobile-nav" data-mobile-nav aria-label="Mobile navigation">
        <a href="index.html">Home</a><a href="games.html">Games</a><a href="about.html">About</a><a href="support.html">Support</a>
      </nav>`;
    if (footer) footer.innerHTML = `
      <footer class="site-footer">
        <div class="footer-lead"><a class="brand" href="index.html"><span class="brand-mark">G</span><span>Game<span>Verse</span></span></a>
          <p>Fast browser games, clean competition and zero clutter.</p></div>
        <div><h3>Explore</h3><a href="games.html">All games</a><a href="about.html">About us</a><a href="support.html">Support</a></div>
        <div><h3>Play</h3><a href="play.html?id=fruit-slice">Fruit Slice Rush</a><a href="play.html?id=vector-run">Vector Run</a><a href="play.html?id=car-racing">Apex Neon</a></div>
        <div><h3>Standards</h3><span>Responsive design</span><span>Keyboard friendly</span><span>No downloads</span></div>
        <div class="footer-bottom"><span>© 2026 GameVerse</span><span>Created by Rdx Siam</span></div>
      </footer>`;
    document.querySelector("[data-menu]")?.addEventListener("click", event => {
      const nav = document.querySelector("[data-mobile-nav]");
      nav.classList.toggle("open");
      event.currentTarget.setAttribute("aria-expanded", String(nav.classList.contains("open")));
      event.currentTarget.innerHTML = icon(nav.classList.contains("open") ? "close" : "menu");
    });
    addEventListener("scroll", () => header?.classList.toggle("scrolled", scrollY > 16), {passive:true});
    addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      document.querySelector("[data-mobile-nav]")?.classList.remove("open");
    });
  }

  function card(game, featured = false) {
    const favorites = JSON.parse(localStorage.getItem("gameverse-favorites") || "[]");
    const saved = favorites.includes(game.id);
    return `<article class="game-card ${featured ? "featured-card" : ""}" style="--accent:${game.accent}">
      <a class="game-art" href="detail.html?id=${game.id}" aria-label="View ${game.name}">
        <img src="${game.card}" alt="${game.name} game artwork" loading="lazy"><span class="game-category">${game.category}</span>
      </a>
      <button class="favorite-button ${saved ? "saved" : ""}" data-favorite="${game.id}" aria-label="${saved ? "Remove" : "Add"} ${game.name} ${saved ? "from" : "to"} favorites" aria-pressed="${saved}">${icon("heart")}</button>
      <div class="game-card-body"><div><h3><a href="detail.html?id=${game.id}">${game.name}</a></h3><p>${game.short}</p></div>
      <a class="play-icon" href="play.html?id=${game.id}" aria-label="Play ${game.name}">${icon("play")}</a></div>
    </article>`;
  }

  function renderGames() {
    let activeFilter = "All";
    let searchTerm = "";
    const libraryGrid = document.querySelector("[data-game-grid]:not([data-limit])");
    const favorites = () => JSON.parse(localStorage.getItem("gameverse-favorites") || "[]");
    const updateLibrary = () => {
      if (!libraryGrid) return;
      const shown = games.filter(game => {
        const matchesFilter = activeFilter === "All" ||
          (activeFilter === "Favorites" ? favorites().includes(game.id) : game.category === activeFilter);
        const haystack = `${game.name} ${game.category} ${game.short}`.toLowerCase();
        return matchesFilter && haystack.includes(searchTerm);
      });
      libraryGrid.innerHTML = shown.map(game => card(game)).join("");
      const count = document.querySelector("[data-result-count]");
      const empty = document.querySelector("[data-empty-games]");
      if (count) count.textContent = `${shown.length} ${shown.length === 1 ? "game" : "games"}`;
      if (empty) empty.hidden = shown.length !== 0;
    };
    document.querySelectorAll("[data-game-grid]").forEach(grid => {
      const limit = Number(grid.dataset.limit || games.length);
      grid.innerHTML = games.slice(0, limit).map((game, index) => card(game, index === 0 && limit < games.length)).join("");
    });
    const filters = document.querySelector("[data-filters]");
    if (filters) {
      filters.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button) return;
        filters.querySelectorAll("button").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter;
        updateLibrary();
      });
    }
    document.querySelector("[data-game-search]")?.addEventListener("input", event => {
      searchTerm = event.target.value.trim().toLowerCase();
      updateLibrary();
    });
    document.querySelector("[data-surprise]")?.addEventListener("click", () => {
      const game = games[Math.floor(Math.random() * games.length)];
      location.href = `play.html?id=${game.id}`;
    });
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-favorite]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      let saved = favorites();
      const id = button.dataset.favorite;
      saved = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
      localStorage.setItem("gameverse-favorites", JSON.stringify(saved));
      button.classList.toggle("saved", saved.includes(id));
      button.setAttribute("aria-pressed", String(saved.includes(id)));
      if (activeFilter === "Favorites") updateLibrary();
    });
  }

  function renderDetail() {
    const root = document.querySelector("[data-game-detail]");
    if (!root) return;
    const game = byId(new URLSearchParams(location.search).get("id")) || games[0];
    document.title = `${game.name} — GameVerse`;
    root.innerHTML = `
      <section class="detail-hero" style="--accent:${game.accent};background-image:linear-gradient(90deg,#070b18 4%,rgba(7,11,24,.78) 48%,rgba(7,11,24,.12)),url('${game.cover}')">
        <div class="detail-copy"><a class="eyebrow" href="games.html">← All games</a><span class="game-category">${game.category}</span>
        <h1>${game.name}</h1><p>${game.description}</p>
        <div class="hero-actions"><a class="button" href="play.html?id=${game.id}">${icon("play")} Play instantly</a><a class="button button-ghost" href="#how">How to play</a></div></div>
      </section>
      <section class="info-strip"><div><span>Mode</span><strong>${game.players}</strong></div><div><span>Skill</span><strong>${game.difficulty}</strong></div><div><span>Platform</span><strong>Browser</strong></div><div><span>Install</span><strong>Not needed</strong></div></section>
      <section class="content-section split" id="how"><div><p class="eyebrow">Quick start</p><h2>Ready in seconds</h2><p>Open the game, use the on-screen prompt and chase a better score. Controls adapt to mouse, keyboard and touch.</p></div>
      <div class="steps"><div><b>01</b><span>Press play</span></div><div><b>02</b><span>Follow the control hint</span></div><div><b>03</b><span>Beat your score</span></div></div></section>
      <section class="content-section related-games"><div class="section-heading"><div><p class="eyebrow">Keep exploring</p><h2>More from GameVerse</h2></div><a class="text-link" href="games.html">All games →</a></div><div class="game-grid">${games.filter(item => item.id !== game.id).slice(0,4).map(item => card(item)).join("")}</div></section>`;
  }

  function rememberAndResume() {
    document.addEventListener("click", event => {
      const link = event.target.closest('a[href*="play.html?id="]');
      if (!link) return;
      const id = new URL(link.href).searchParams.get("id");
      if (id) localStorage.setItem("gameverse-recent", id);
    });
    const recent = byId(localStorage.getItem("gameverse-recent")) || games[0];
    const section = document.querySelector("[data-recent]");
    if (!section || !recent) return;
    section.querySelector("[data-recent-link]").href = `play.html?id=${recent.id}`;
    section.querySelector("[data-recent-image]").src = recent.card;
    section.querySelector("[data-recent-image]").alt = `${recent.name} artwork`;
    section.querySelector("[data-recent-name]").textContent = recent.name;
    section.querySelector("[data-recent-copy]").textContent = recent.short;
  }

  function welcome() {
    const loader = document.querySelector("[data-loader]");
    if (!loader) return;
    setTimeout(() => loader.classList.add("done"), 1250);
    setTimeout(() => loader.remove(), 1800);
  }

  layout();
  renderGames();
  renderDetail();
  rememberAndResume();
  welcome();
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
})();
