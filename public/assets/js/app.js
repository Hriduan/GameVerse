(() => {
  const games = window.GAMEVERSE_GAMES || [];
  const byId = id => games.find(game => game.id === id);
  const path = location.pathname.split("/").pop() || "index.html";

  const icon = (name) => ({
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
  }[name]);

  function layout() {
    const header = document.querySelector("[data-header]");
    const footer = document.querySelector("[data-footer]");
    if (header) header.innerHTML = `
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
      event.currentTarget.innerHTML = icon(nav.classList.contains("open") ? "close" : "menu");
    });
  }

  function card(game, featured = false) {
    return `<article class="game-card ${featured ? "featured-card" : ""}" style="--accent:${game.accent}">
      <a class="game-art" href="detail.html?id=${game.id}" aria-label="View ${game.name}">
        <img src="${game.card}" alt="${game.name} game artwork"><span class="game-category">${game.category}</span>
      </a>
      <div class="game-card-body"><div><h3><a href="detail.html?id=${game.id}">${game.name}</a></h3><p>${game.short}</p></div>
      <a class="play-icon" href="play.html?id=${game.id}" aria-label="Play ${game.name}">${icon("play")}</a></div>
    </article>`;
  }

  function renderGames() {
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
        const value = button.dataset.filter;
        document.querySelector("[data-game-grid]").innerHTML =
          games.filter(game => value === "All" || game.category === value).map(game => card(game)).join("");
      });
    }
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
      <div class="steps"><div><b>01</b><span>Press play</span></div><div><b>02</b><span>Follow the control hint</span></div><div><b>03</b><span>Beat your score</span></div></div></section>`;
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
  welcome();
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
})();
