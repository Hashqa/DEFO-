/*
  Spooky Burst — moteur de jeu.
  Produit une partie complète sous forme de liste d'événements (format "livre" Stake Engine).
  Format compact : plateau = 7 chaînes (une par ligne, chiffres 0-7, 7 = Bonus) ; case = ligne*7+colonne.
    reveal      { board:[7 chaînes], gameType }
    winInfo     { wins:[{ s:symbole, c:[cases], b:gain de base, m:multiplicateur (0 = aucun), w:gain }], stepWin, spinWin }
    multUpdate  { cells:[[case, nouvelle valeur]] }
    tumble      { removed:[cases], add:[7 chaînes : nouveaux symboles par colonne, du haut vers le bas] }
    scatters    { count, cells:[cases] }
    freeSpinTrigger { count, scatters, startCells:[[case, valeur]] } · freeSpin { number, left } · freeSpinRetrigger { added, left }
    freeSpinEnd { total, played, topUp, maxed } · winCap { amount } · finalWin { amount }
  Utilisé à la fois par le générateur de fichiers mathématiques (Node) et par le front-end
  (mode démo hors Stake). Tous les gains sont en dixièmes de mise (entiers) : 1 = 0,1 × la mise,
  ce qui respecte la règle Stake Engine "paiements par incréments de 0,1 ×".
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpookyEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLS = 7, ROWS = 7, SCATTER = 7;

  // Gains par symbole et taille de groupe (5..14, 15+), en dixièmes de mise.
  // Courbe exponentielle : chaque symbole en plus multiplie le gain par 1,5.
  const SYMBOL_FACTOR = [1, .75, .6, .5, .42, .36, .3];
  const PAY_SCALE = 0.36;
  const PAYTABLE = SYMBOL_FACTOR.map(f => Array.from({ length: 11 }, (_, i) => Math.max(1, Math.round(Math.pow(1.5, i) * f * PAY_SCALE * 10))));

  const CONFIG = {
    COLS, ROWS, SCATTER, PAYTABLE,
    BASE_WEIGHTS: [7, 8, 9, 10, 11, 12, 13],
    SCATTER_W: 0.66,
    BOOST_BASE: 10,
    BOOST_FS: 16, BOOST_FS_HOT: 45, HOT_CHANCE: 0.04,
    MULT_LADDER: [2, 3, 5, 10, 25, 50, 100],   // valeur d'une case après 1, 2, 3… explosions
    MAX_MULT: 100,
    FS_AWARD: { 3: 8, 4: 10, 5: 12, 6: 15, 7: 20 },
    RETRIGGER: 5,
    MIN_BONUS: 100,          // 10 × la mise (en dixièmes)
    MAX_WIN: 250000,         // 25 000 × la mise (en dixièmes)
    MODES: {
      base:  { cost: 1,   label: 'Spin' },
      bonus: { cost: 100, label: 'Bonus', buy: true },
      super: { cost: 300, label: 'Super bonus', buy: true, startCells: 10, startValue: 5 }   // 10 cases au hasard démarrent à x5
    }
  };

  function defaultRng() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
    return Math.random();
  }

  function create(opts = {}) {
    const C = Object.assign({}, CONFIG, opts.config || {});
    const rnd = opts.rng || defaultRng;
    let W = null, WT = 0;

    function profile(fs, forceHot) {
      const w = C.BASE_WEIGHTS.slice();
      const boost = fs ? ((forceHot || rnd() < C.HOT_CHANCE) ? C.BOOST_FS_HOT : C.BOOST_FS) : C.BOOST_BASE;
      w[(rnd() * 7) | 0] += boost;
      W = w.concat([C.SCATTER_W]); WT = W.reduce((a, b) => a + b, 0);
    }
    function pick() { let x = rnd() * WT; for (let i = 0; i < W.length; i++) { x -= W[i]; if (x < 0) return i; } return 0; }
    const zero = v => Array.from({ length: ROWS }, () => Array(COLS).fill(v));

    function randomGrid(force) {
      const g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, pick));
      if (force) {
        let have = 0; for (const row of g) for (const s of row) if (s === SCATTER) have++;
        const order = [...Array(COLS).keys()].sort(() => rnd() - .5);
        for (const c of order) { if (have >= force) break; let has = false; for (let r = 0; r < ROWS; r++) if (g[r][c] === SCATTER) has = true; if (has) continue; g[(rnd() * ROWS) | 0][c] = SCATTER; have++; }
      }
      return g;
    }
    function clusters(g) {
      const seen = zero(false), out = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const s = g[r][c]; if (seen[r][c] || s === SCATTER) continue;
        const st = [[r, c]], cells = []; seen[r][c] = true;
        while (st.length) { const [y, x] = st.pop(); cells.push([y, x]);
          for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !seen[ny][nx] && g[ny][nx] === s) { seen[ny][nx] = true; st.push([ny, nx]); } } }
        if (cells.length >= 5) out.push({ sym: s, cells });
      }
      return out;
    }
    const nextMult = v => { const L = C.MULT_LADDER, k = L.indexOf(v); return v === 0 ? L[0] : k < 0 || k === L.length - 1 ? v : L[k + 1]; };
    const pay = (s, n) => C.PAYTABLE[s][Math.min(n, 15) - 5];

    // Un spin avec cascades. Ajoute les événements, renvoie le gain (dixièmes).
    function spin(ev, spots, fs, force, capLeft, forceHot) {
      profile(fs, forceHot);
      const g = randomGrid(force);
      ev.push({ type: 'reveal', board: g.map(r => r.join('')), gameType: fs ? 'freegame' : 'basegame' });
      let win = 0, maxed = false;
      for (;;) {
        const cl = clusters(g); if (!cl.length) break;
        const wins = []; let step = 0;
        for (const k of cl) {
          let m = 0; for (const [r, c] of k.cells) if (spots[r][c] >= 2) m += spots[r][c];
          const base = pay(k.sym, k.cells.length), w = base * (m || 1);
          wins.push({ s: k.sym, c: k.cells.map(([r, c]) => r * COLS + c), b: base, m, w }); step += w;
        }
        win += step;
        if (win >= capLeft) { win = capLeft; maxed = true; }
        ev.push({ type: 'winInfo', wins, stepWin: step, spinWin: win });
        if (maxed) { ev.push({ type: 'winCap', amount: win }); break; }
        const ups = [];
        for (const k of cl) for (const [r, c] of k.cells) { const v = spots[r][c], nv = nextMult(v); if (nv !== v) { spots[r][c] = nv; ups.push([r * COLS + c, nv]); } }
        // gravité : les symboles restants tombent, de nouveaux arrivent par le haut
        const removed = new Set(); for (const k of cl) for (const [r, c] of k.cells) removed.add(r * COLS + c);
        const add = [];
        for (let c = 0; c < COLS; c++) {
          const col = []; for (let r = ROWS - 1; r >= 0; r--) if (!removed.has(r * COLS + c)) col.push(g[r][c]);
          const n = ROWS - col.length, fresh = Array.from({ length: n }, pick);   // fresh[0] = tout en haut
          add.push(fresh.join(''));
          for (let r = ROWS - 1, i = 0; r >= 0; r--, i++) g[r][c] = i < col.length ? col[i] : fresh[n - 1 - (i - col.length)];
        }
        ev.push({ type: 'multUpdate', cells: ups });
        ev.push({ type: 'tumble', removed: [...removed], add });
      }
      let sc = 0; const scCells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g[r][c] === SCATTER) { sc++; scCells.push(r * COLS + c); }
      if (!maxed && sc >= 3) ev.push({ type: 'scatters', count: sc, cells: scCells });
      return { win, maxed, sc };
    }
    const fsFor = n => C.FS_AWARD[Math.min(n, 7)] || 0;

    function freeSpins(ev, count, M, capLeft, scCount, forceHot) {
      const spots = zero(0), startCells = [];
      if (M.startCells) {
        const all = [...Array(ROWS * COLS).keys()];
        for (let k = 0; k < M.startCells; k++) { const i = all.splice((rnd() * all.length) | 0, 1)[0]; spots[(i / COLS) | 0][i % COLS] = M.startValue; startCells.push([i, M.startValue]); }
        startCells.sort((a, b) => a[0] - b[0]);
      }
      ev.push({ type: 'freeSpinTrigger', count, scatters: scCount, startCells });
      let left = count, total = 0, played = 0, maxed = false;
      while (left > 0) {
        left--; played++;
        ev.push({ type: 'freeSpin', number: played, left });
        const r = spin(ev, spots, true, 0, capLeft - total, forceHot);
        total += r.win;
        if (r.maxed) { maxed = true; break; }
        if (r.sc >= 3) { left += C.RETRIGGER; ev.push({ type: 'freeSpinRetrigger', added: C.RETRIGGER, left }); }
      }
      let topUp = 0;
      if (!maxed && total < C.MIN_BONUS) { topUp = C.MIN_BONUS - total; total = C.MIN_BONUS; }
      ev.push({ type: 'freeSpinEnd', total, played, topUp, maxed });
      return { total, maxed };
    }

    // Une partie complète dans un mode donné.
    function playRound(mode = 'base', o = {}) {
      const M = C.MODES[mode]; if (!M) throw new Error('mode inconnu: ' + mode);
      const ev = [], cap = C.MAX_WIN;
      let total = 0, base = 0, free = 0;
      const first = spin(ev, zero(0), false, M.buy ? (o.force4 || rnd() < .18 ? 4 : 3) : (o.forceTrigger || 0), cap);
      total += first.win; base += first.win;
      if (!first.maxed && (M.buy || first.sc >= 3)) {
        const sc = Math.max(3, first.sc);
        const fs = freeSpins(ev, fsFor(sc), M, cap - total, sc, o.forceHot);
        total += fs.total; free += fs.total;
      }
      if (total > cap) total = cap;
      ev.push({ type: 'finalWin', amount: total });
      ev.forEach((e, i) => e.index = i);
      return {
        payoutMultiplier: total * 10,          // centièmes (format Stake), multiple de 10
        payoutX: total / 10,                   // en × mise
        events: ev,
        criteria: total >= cap ? 'wincap' : (free > 0 || M.buy) ? 'freegame' : total > 0 ? 'basegame' : '0',
        baseGameWins: base / 10, freeGameWins: free / 10
      };
    }
    return { playRound, config: C };
  }

  return { create, CONFIG };
});
