(() => {
  const id = new URLSearchParams(location.search).get("id") || "fruit-slice";
  const game = (window.GAMEVERSE_GAMES || []).find(item => item.id === id) || window.GAMEVERSE_GAMES[0];
  const config = window.GameVerseGames[game.id];
  const canvas = document.querySelector("[data-game-canvas]");
  const overlay = document.querySelector("[data-game-overlay]");
  const startButton = document.querySelector("[data-start]");
  const scoreNode = document.querySelector("[data-score]");
  const bestNode = document.querySelector("[data-best]");
  const bestKey = `gameverse-best-${game.id}`;
  let best = Number(localStorage.getItem(bestKey) || 0);
  document.title = `Play ${game.name} — GameVerse`;
  document.querySelector("[data-play-title]").textContent = game.name;
  document.querySelector("[data-game-info]").href = `detail.html?id=${game.id}`;
  document.querySelector("[data-controls]").textContent = config.controls;
  bestNode.textContent = best;
  const engine = GameVerseEngine.create(config, canvas, (score, message) => {
    scoreNode.textContent = score;
    if(score > best){best = score;bestNode.textContent = best;localStorage.setItem(bestKey,best)}
    if(message){
      document.querySelector("[data-overlay-title]").textContent = message;
      document.querySelector("[data-overlay-copy]").textContent = `Score: ${score}. Ready for another run?`;
      startButton.textContent = "Play again";
      overlay.classList.remove("hidden");
      if (location.protocol !== "https:" || ["localhost","127.0.0.1"].includes(location.hostname)) {
        fetch("/api/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:game.id,score,at:new Date().toISOString()})}).catch(()=>{});
      }
    }
  });
  startButton.addEventListener("click",()=>{overlay.classList.add("hidden");engine.start()});
})();
