(() => {
  "use strict";

  const levels = [
    { name: "Primeiro impulso", par: 16, energy: 26, fact: "A mielina protege os neurônios e ajuda o impulso nervoso a viajar com eficiência.", map: ["#######", "#S..M.#", "#.###.#", "#...#.#", "###.#.#", "#M...G#", "#######"] },
    { name: "Zona sensível", par: 17, energy: 27, fact: "Na EM, a inflamação pode danificar a mielina e alterar a comunicação entre cérebro e corpo.", map: ["#######", "#S#...#", "#.#M#.#", "#...#.#", "#I###.#", "#M.B.G#", "#######"] },
    { name: "Atalho neural", par: 19, energy: 30, fact: "Os sintomas variam porque diferentes áreas do sistema nervoso podem ser afetadas.", map: ["#######", "#S..#G#", "###.#.#", "#M..#.#", "#.###.#", "#M.T.T#", "#######"] },
    { name: "Dupla barreira", par: 24, energy: 35, fact: "Fadiga, alterações visuais, formigamento e desequilíbrio são sinais possíveis, mas não confirmam diagnóstico.", map: ["#######", "#S.M..#", "#.###I#", "#..M..#", "#I###.#", "#B.M.G#", "#######"] },
    { name: "Conexão final", par: 22, energy: 34, fact: "Acompanhamento especializado e tratamento individualizado favorecem autonomia e qualidade de vida.", map: ["#######", "#S#M#G#", "#.#.#.#", "#M.I.M#", "#.###.#", "#B.T.T#", "#######"] }
  ];

  const $ = (id) => document.getElementById(id);
  const board = $("labBoard");
  const overlay = $("gameOverlay");
  const phaseLabel = $("phaseLabel");
  const levelName = $("levelName");
  const energy = $("energy");
  const lives = $("lives");
  const myelinCount = $("myelinCount");
  const score = $("score");
  const missionTitle = $("missionTitle");
  const message = $("message");
  const parText = $("parText");
  const pauseBtn = $("pauseBtn");
  const undoBtn = $("undoBtn");
  const overlayIcon = $("overlayIcon");
  const overlayKicker = $("overlayKicker");
  const overlayTitle = $("overlayTitle");
  const overlayText = $("overlayText");
  const overlayBtn = $("overlayBtn");

  let level = 0;
  let status = "idle";
  let state;
  let history = [];
  let stars = [];
  let levelStartScore = 0;
  let best = 0;

  try { best = Number(localStorage.getItem("neurolab-best") || 0); } catch (_) {}

  function find(map, char) {
    for (let r = 0; r < map.length; r++) {
      const c = map[r].indexOf(char);
      if (c >= 0) return { r, c };
    }
    return { r: 1, c: 1 };
  }

  function fresh(index, total) {
    return { pos: find(levels[index].map, "S"), moves: 0, energy: levels[index].energy, lives: 3, shield: false, collected: [], score: total, message: "Colete toda a mielina e alcance a sinapse final." };
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function positionKey(pos) { return `${pos.r}-${pos.c}`; }
  function totalMyelin() { return levels[level].map.join("").split("M").length - 1; }

  function iconFor(char, collected) {
    if (char === "M" && !collected) return '<i class="myelinOrb">◌</i>';
    if (char === "I") return '<i class="inflame">✹</i>';
    if (char === "B") return '<i class="shieldOrb">⬡</i>';
    if (char === "T") return '<i class="portalOrb">◎</i>';
    if (char === "G") return '<i class="goalOrb">✦</i>';
    return "";
  }

  function cellLabel(char) {
    return { "#": "Barreira", M: "Fragmento de mielina", I: "Zona de inflamação", B: "Escudo protetor", T: "Portal neural", G: "Sinapse final", S: "Início" }[char] || "Rota neural";
  }

  function renderBoard() {
    board.innerHTML = "";
    levels[level].map.forEach((row, r) => {
      [...row].forEach((char, c) => {
        const here = state.pos.r === r && state.pos.c === c;
        const collected = char === "M" && state.collected.includes(`${r}-${c}`);
        const tile = document.createElement("div");
        tile.className = `tile t-${char === "#" ? "wall" : char}${here ? " player" : ""}${collected ? " collected" : ""}`;
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", here ? "Sinal neural" : cellLabel(char));
        tile.innerHTML = iconFor(char, collected) + (here ? '<i class="signalOrb">➤</i>' : "");
        board.appendChild(tile);
      });
    });
  }

  function renderTrack() {
    $("levelTrack").innerHTML = levels.map((_, i) => `<i class="${i < level ? "done" : i === level ? "current" : ""}">${i < stars.length ? "★" : i + 1}</i>`).join("");
  }

  function render() {
    const current = levels[level];
    phaseLabel.textContent = `NEUROLAB · FASE ${level + 1}/${levels.length}`;
    levelName.textContent = current.name;
    energy.textContent = state.energy;
    lives.textContent = "●".repeat(Math.max(0, state.lives));
    myelinCount.textContent = `${state.collected.length}/${totalMyelin()}`;
    score.textContent = state.score.toLocaleString("pt-BR");
    missionTitle.textContent = state.collected.length === totalMyelin() ? "Rota liberada!" : "Restaure a proteção";
    message.textContent = state.message;
    parText.textContent = `Complete em até ${current.par} movimentos para 3 estrelas.`;
    undoBtn.disabled = !history.length || status !== "playing";
    pauseBtn.disabled = status === "idle" || status === "won" || status === "lost" || status === "level";
    pauseBtn.textContent = status === "paused" ? "▶" : "Ⅱ";
    renderBoard();
    renderTrack();
  }

  function setOverlay(kind) {
    const content = {
      idle: ["⌬", "NOVO JOGO · PUZZLE TÁTICO", "Restaure as<br>rotas neurais.", "Explore cinco mapas, recolha toda a mielina e alcance a sinapse. Planeje seus movimentos, use escudos e encontre portais.", "Entrar no NeuroLab →"],
      paused: ["Ⅱ", "JOGO PAUSADO", "A rota espera<br>por você.", "Respire, observe o tabuleiro e volte quando estiver pronto.", "Continuar →"],
      lost: ["↻", "ENERGIA INTERROMPIDA", "Recalcule<br>a rota.", "Use “desfazer” para testar caminhos e evite as zonas de inflamação quando não tiver escudo.", "Tentar novamente ↻"]
    }[kind];
    overlayIcon.textContent = content[0];
    overlayKicker.textContent = content[1];
    overlayTitle.innerHTML = content[2];
    overlayText.textContent = content[3];
    overlayBtn.textContent = content[4];
    overlay.hidden = false;
  }

  function start() {
    level = 0;
    stars = [];
    history = [];
    levelStartScore = 0;
    state = fresh(0, 0);
    status = "playing";
    overlay.hidden = true;
    render();
  }

  function restart() {
    history = [];
    state = fresh(level, levelStartScore);
    status = "playing";
    overlay.hidden = true;
    render();
  }

  function nextLevel() {
    level += 1;
    levelStartScore = state.score;
    history = [];
    state = fresh(level, levelStartScore);
    status = "playing";
    overlay.hidden = true;
    render();
  }

  function undo() {
    if (!history.length || status !== "playing") return;
    state = history.pop();
    render();
  }

  function showLevelComplete(earned) {
    status = "level";
    overlayIcon.textContent = "✦";
    overlayKicker.textContent = `FASE ${level + 1} CONCLUÍDA · ${"★".repeat(earned)}`;
    overlayTitle.innerHTML = "Conexão<br>restaurada.";
    overlayText.textContent = levels[level].fact;
    overlayBtn.textContent = `Abrir fase ${level + 2} →`;
    overlay.hidden = false;
  }

  function showWin() {
    status = "won";
    best = Math.max(best, state.score);
    try { localStorage.setItem("neurolab-best", String(best)); } catch (_) {}
    overlayIcon.textContent = "✦";
    overlayKicker.textContent = `NEUROLAB CONCLUÍDO · ${stars.reduce((a, b) => a + b, 0)}/15 ESTRELAS`;
    overlayTitle.innerHTML = "Todas as rotas<br>foram restauradas.";
    overlayText.innerHTML = `${levels[level].fact}<br>Pontuação: ${state.score.toLocaleString("pt-BR")} · Recorde: ${best.toLocaleString("pt-BR")}`;
    overlayBtn.textContent = "Nova partida ↻";
    overlay.hidden = false;
  }

  function move(dr, dc) {
    if (status !== "playing") return;
    const current = levels[level];
    const next = { r: state.pos.r + dr, c: state.pos.c + dc };
    const cell = current.map[next.r] && current.map[next.r][next.c];
    if (!cell || cell === "#") {
      state.message = "Essa rota está bloqueada. Tente outro caminho.";
      render();
      return;
    }

    history.push(clone(state));
    state.pos = next;
    state.moves += 1;
    state.energy -= 1;
    state.message = "Sinal em movimento…";
    const spot = positionKey(next);

    if (cell === "M" && !state.collected.includes(spot)) {
      state.collected.push(spot);
      state.score += 250;
      state.message = "Mielina restaurada! +250 pontos";
    }
    if (cell === "B") {
      state.shield = true;
      state.score += 100;
      state.message = "Escudo protetor ativado.";
    }
    if (cell === "I") {
      if (state.shield) {
        state.shield = false;
        state.score += 75;
        state.message = "O escudo absorveu a zona inflamatória.";
      } else {
        state.lives -= 1;
        state.score = Math.max(0, state.score - 100);
        state.message = "A inflamação reduziu uma vida.";
      }
    }
    if (cell === "T") {
      const portals = [];
      current.map.forEach((row, r) => [...row].forEach((x, c) => { if (x === "T") portals.push({ r, c }); }));
      const other = portals.find((p) => positionKey(p) !== spot);
      if (other) {
        state.pos = other;
        state.score += 50;
        state.message = "Salto neural! +50 pontos";
      }
    }
    if (cell === "G") {
      if (state.collected.length < totalMyelin()) {
        state.message = `Ainda faltam ${totalMyelin() - state.collected.length} fragmento(s) de mielina.`;
      } else {
        const earned = state.moves <= current.par ? 3 : state.moves <= current.par + 6 ? 2 : 1;
        state.score += earned * 400 + state.energy * 20 + state.lives * 150;
        stars[level] = earned;
        if (level === levels.length - 1) showWin(); else showLevelComplete(earned);
      }
    }
    if (status === "playing" && (state.energy <= 0 || state.lives <= 0)) {
      status = "lost";
      setOverlay("lost");
    }
    render();
  }

  overlayBtn.addEventListener("click", () => {
    if (status === "idle" || status === "won") start();
    else if (status === "paused") { status = "playing"; overlay.hidden = true; render(); }
    else if (status === "lost") restart();
    else if (status === "level") nextLevel();
  });
  pauseBtn.addEventListener("click", () => {
    if (status === "playing") { status = "paused"; setOverlay("paused"); }
    else if (status === "paused") { status = "playing"; overlay.hidden = true; }
    render();
  });
  undoBtn.addEventListener("click", undo);
  $("restartBtn").addEventListener("click", restart);
  document.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => {
    const directions = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    move(...directions[button.dataset.move]);
  }));
  window.addEventListener("keydown", (event) => {
    const directions = { ArrowUp: [-1, 0], w: [-1, 0], W: [-1, 0], ArrowDown: [1, 0], s: [1, 0], S: [1, 0], ArrowLeft: [0, -1], a: [0, -1], A: [0, -1], ArrowRight: [0, 1], d: [0, 1], D: [0, 1] };
    if (directions[event.key]) { event.preventDefault(); move(...directions[event.key]); }
    if (event.key === "u" || event.key === "U") undo();
  });

  state = fresh(0, 0);
  setOverlay("idle");
  render();
})();
