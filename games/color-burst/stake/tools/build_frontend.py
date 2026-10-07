#!/usr/bin/env python3
"""
Construit le front-end Stake Engine de Spooky Burst à partir du jeu (games/color-burst/index.html).

Le jeu d'origine calcule ses résultats dans le navigateur. La version Stake :
  - demande chaque partie au serveur de Stake (RGS : /wallet/authenticate, /wallet/play, /wallet/end-round)
    et se contente d'animer la liste d'événements reçue (les "livres" générés par stake/math/generate.js) ;
  - sans paramètres Stake dans l'URL, tourne en démo avec le même moteur (stake/engine.js) en local ;
  - gère la reprise d'une partie interrompue, le rejeu (?replay=true), les devises, les niveaux de mise,
    les options imposées par la juridiction, l'anglais et le français.

Usage : python3 stake/tools/build_frontend.py      → écrit stake/frontend/
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(GAME, 'index.html')
OUT = os.path.join(GAME, 'stake', 'frontend')

s = open(SRC, encoding='utf-8').read()

def sub(old, new, count=1):
    global s
    assert old in s, 'introuvable : ' + old[:90]
    s = s.replace(old, new, count)

def region(start, end, new):
    """Remplace le texte entre deux repères (le repère de fin est conservé)."""
    global s
    a = s.index(start); b = s.index(end, a)
    s = s[:a] + new + s[b:]

# ------------------------------------------------------------------ page
sub('<html lang="fr">', '<html lang="en">')
sub('<title>Color Burst</title>', '<title>Spooky Burst</title>')
sub('<h1 class="logo" aria-label="Color Burst"><span>C</span><span>O</span><span>L</span><span>O</span><span>R</span><b>BURST</b></h1>',
    '<h1 class="logo" aria-label="Spooky Burst"><span>S</span><span>P</span><span>O</span><span>O</span><span>K</span><span>Y</span><b>BURST</b></h1>')
sub('<select id="themeSel" aria-label="Thème de la machine"><option value="classic">Classique</option><option value="halloween">Halloween</option></select>', '')
sub('<div class="pill" aria-live="polite"><small>Solde</small>', '<div class="pill" aria-live="polite"><small id="tBalance">Balance</small>')
sub('<span class="k">Acheter le bonus</span>\n        <span class="d">10 free spins garantis, multiplicateurs persistants.</span>',
    '<span class="k" id="tBuy">Buy bonus</span>\n        <span class="d" id="tBuyD"></span>')
sub('<span class="k">Super bonus</span>\n        <span class="d">10 free spins, toutes les cases démarrent à <b>x2</b>.</span>',
    '<span class="k" id="tSup">Super bonus</span>\n        <span class="d" id="tSupD"></span>')
sub('<h2>Gains des symboles</h2>\n        <p class="vsub">Pour une mise de <b id="valBet">1,00</b> · selon la taille du groupe</p>',
    '<h2 id="tPay">Symbol payouts</h2>\n        <p class="vsub"><span id="tPaySub"></span> <b id="valBet">1.00</b></p>')
sub('''<p class="note"><b style="color:var(--gold)">Gain max : <span id="maxWin">25 000,00</span></b><br> Crédits fictifs, aucune mise réelle. Les gains sont tirés au hasard via l'aléatoire cryptographique du navigateur.</p>''',
    '<p class="note"><b style="color:var(--gold)"><span id="tMax">Max win:</span> <span id="maxWin"></span></b><br><span id="tNote"></span></p>\n      <p class="note sess" id="sess" hidden></p>')
sub('<div><div class="lab">Free spins</div><div class="val" id="fsLeft">10</div></div>\n        <div class="r"><div class="lab">Gain du bonus</div>',
    '<div><div class="lab">Free spins</div><div class="val" id="fsLeft">10</div></div>\n        <div class="r"><div class="lab" id="tFsWin">Bonus win</div>')
sub('<div class="heat" id="heat" hidden>Multiplicateurs en jeu <b id="heatVal">×0</b></div>', '<div class="heat" id="heat" hidden><span id="tHeat">Multipliers in play</span> <b id="heatVal">×0</b></div>')
sub('<span class="msg" id="msg">Formez des groupes de 5 symboles identiques ou plus.</span>', '<span class="msg" id="msg"></span>')
sub('<small>Mise</small>', '<small id="tBet">Bet</small>')
sub('<small>Vitesse</small>', '<small id="tSpeed">Speed</small>')
sub('<select id="autoSel" aria-label="Nombre de spins automatiques"><option value="0">Auto off</option>',
    '<select id="autoSel" aria-label="Autoplay"><option value="0">Auto off</option>')
# le moteur (démo hors Stake) est chargé avant le script du jeu
sub('<canvas id="fx"></canvas>\n\n<script>', '<canvas id="fx"></canvas>\n\n<script src="engine.js"></script>\n<script>')

# ------------------------------------------------------------------ configuration (depuis le moteur)
region('/* ============ CONFIG ============ */', '/* ============ THÈMES ============', r'''/* ============ CONFIG ============ */
/* Les règles et gains viennent du moteur (stake/engine.js) : les mêmes que les fichiers mathématiques publiés. */
const ENG = SpookyEngine.create();
const CFG = SpookyEngine.CONFIG;
const COLS = CFG.COLS, ROWS = CFG.ROWS, SCATTER = CFG.SCATTER;
const PAYTABLE = CFG.PAYTABLE.map(r => r.map(v => v / 10));      // × mise
const MAX_WIN_X = CFG.MAX_WIN / 10, MIN_BONUS_X = CFG.MIN_BONUS / 10, MAX_MULT = CFG.MAX_MULT, RETRIGGER = CFG.RETRIGGER;
const BUY_STD = CFG.MODES.bonus.cost, BUY_SUP = CFG.MODES.super.cost;
const RTP_TEXT = '96.20%';
const DEMO_BALANCE = 1000;
let BETS = [0.1,0.2,0.4,0.6,0.8,1,2,4,5,10,20,50,100];
const MULT_COLORS = {2:'#3a86ff',4:'#2ecc71',8:'#ffd60a',16:'#ff9f1c',32:'#ff4d4d',64:'#c77dff',128:'#ff5fa2',256:'#22d3ee',512:'#ffffff',1024:'#ffc83d'};

/* ============ LANGUE ============ */
const Q = new URLSearchParams(location.search);
const LANG = (Q.get('lang') || navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
const SOCIAL = Q.get('social') === 'true';
const I18N = {
  en: { balance:'Balance', bet: SOCIAL?'Play':'Bet', buy: SOCIAL?'Get bonus':'Buy bonus', buyD:'10+ free spins, persistent multipliers.', sup:'Super bonus', supD:'10+ free spins, every cell starts at <b>x2</b>.',
    pay:'Symbol payouts', paySub:'By cluster size, for', max:'Max win:', speed:'Speed', note:'Theoretical RTP '+RTP_TEXT+'.', demo:'Demo mode – play money.', fsWin:'Bonus win', heat:'Multipliers in play',
    hint:'Form clusters of 5 or more matching symbols.', luck:'Good luck…', nowin:'No cluster this time.', win:'Win', nice:'NICE WIN!', big:'BIG WIN!', huge:'HUGE!', bonusPaid:'Bonus paid!',
    left:n=>n+' left', trig:'Bonus triggered', bought: SOCIAL?'Bonus started':'Bonus bought', spins:n=>n+' FREE SPINS',
    intro:n=>n+' Bonus symbols. Multipliers stay on the grid for the whole bonus and keep doubling.', introSup:'<b>Super bonus:</b> all 49 cells start at x2.', start:'Start',
    retrig:'Retrigger', retrigT:n=>n+' Bonus symbols during the bonus.', over:'Bonus complete', maxed:'Max win reached', inSpins:n=>'in '+n+' free spin'+(n>1?'s':''), cont:'Continue',
    confirm:(b,sup)=>'For a bet of '+b+', you get <b>10 or more free spins</b>'+(sup?', with <b>every cell at x2</b> from the start':'')+'.', cancel:'Cancel', buyBtn: SOCIAL?'Get':'Buy',
    cascade:n=>'CASCADE ×'+n, skip:'Tap to skip', tapCont:'Tap to continue', tiers:['BIG WIN','MEGA WIN','EPIC WIN','LEGENDARY'], best:'(best)', symbol:'Symbol',
    replayDone:'Replay complete', replayAgain:'Watch again', session:'Session', net:'Net',
    err:{ ERR_IPB:'Insufficient balance.', ERR_IS:'Your session has expired. Please reload the game.', ERR_ATE:'Authentication failed. Please reload the game.', ERR_GLE:'Gambling limit reached.', ERR_LOC:'This game is not available in your location.', ERR_MAINTENANCE:'The game is under maintenance. Please try again later.', def:'Connection problem. Please try again.' },
    rules:(f)=>`<h2>Rules</h2>
      <p>7 × 7 grid. A cluster of <b>5 or more matching symbols</b>, connected horizontally or vertically, pays according to its size. Payouts below are for your current bet of <b>${f.bet}</b>; each extra symbol in a cluster pays more, up to 15+.</p>
      ${f.table}
      <h3>Tumbles</h3><p>Winning symbols explode, the symbols above fall down and new ones drop in. Tumbles continue as long as new clusters form.</p>
      <h3>Multiplier spots</h3><ul><li>When a winning symbol explodes on a cell, the cell becomes <b>x2</b>.</li><li>Each further explosion on that cell doubles it: x4, x8, x16… up to x${MAX_MULT}.</li><li>A cluster on multiplier cells adds their values together (x4 + x8 = ×12) and multiplies its win.</li><li>In the base game the cells reset every spin. During free spins they stay until the end of the bonus.</li></ul>
      ${f.ladder}
      <h3>Free spins</h3><p>${f.scatter} 3 Bonus symbols = 10 spins · 4 = 12 · 5 = 15 · 6 = 20 · 7+ = 30. During the bonus, 3 or more Bonus symbols award ${RETRIGGER} extra spins. A bonus always pays at least ${MIN_BONUS_X}× the bet.</p>
      ${f.buy}
      <h3>Max win</h3><p>Wins are capped at <b>${MAX_WIN_X.toLocaleString('en-US')}× the bet</b> (${f.maxwin}). When reached, the round ends and the max win is paid.</p>
      <h3>Return to player</h3><p>The theoretical RTP is <b>${RTP_TEXT}</b> for the base game and for both bonus buys.</p>
      <p style="color:var(--mute);font-size:13px">Malfunction voids all pays and plays.${f.space?' Shortcut: Space to spin.':''}</p>`,
    rulesBuy:(a,b)=>`<h3>Bonus buy</h3><p>Buy bonus: ${a} (100× the bet). Super bonus, all cells start at x2: ${b} (300× the bet).</p>`, close:'Close' },
  fr: { balance:'Solde', bet: SOCIAL?'Jeu':'Mise', buy: SOCIAL?'Obtenir le bonus':'Acheter le bonus', buyD:'10 free spins ou plus, multiplicateurs persistants.', sup:'Super bonus', supD:'10 free spins ou plus, toutes les cases démarrent à <b>x2</b>.',
    pay:'Gains des symboles', paySub:'Selon la taille du groupe, pour', max:'Gain max :', speed:'Vitesse', note:'Taux de retour théorique '+RTP_TEXT.replace('.',',')+'.', demo:'Mode démo – argent fictif.', fsWin:'Gain du bonus', heat:'Multiplicateurs en jeu',
    hint:'Formez des groupes de 5 symboles identiques ou plus.', luck:'Bonne chance…', nowin:'Pas de groupe cette fois.', win:'Gain', nice:'JOLI GAIN !', big:'GROS GAIN !', huge:'ÉNORME !', bonusPaid:'Bonus encaissé !',
    left:n=>n+' restant'+(n>1?'s':''), trig:'Bonus déclenché', bought: SOCIAL?'Bonus lancé':'Bonus acheté', spins:n=>n+' FREE SPINS',
    intro:n=>n+' symboles Bonus. Pendant tout le bonus, les multiplicateurs <b>restent en place</b> et continuent de doubler.', introSup:'<b>Super bonus :</b> les 49 cases démarrent déjà à x2.', start:'Commencer',
    retrig:'Relance', retrigT:n=>n+' symboles Bonus pendant le bonus.', over:'Bonus terminé', maxed:'Gain maximum atteint', inSpins:n=>'en '+n+' free spin'+(n>1?'s':''), cont:'Continuer',
    confirm:(b,sup)=>'Pour une mise de '+b+', vous obtenez <b>10 free spins</b> ou plus'+(sup?', avec <b>toutes les cases à x2</b> dès le départ':'')+'.', cancel:'Annuler', buyBtn: SOCIAL?'Obtenir':'Acheter',
    cascade:n=>'CASCADE ×'+n, skip:'Touchez pour passer', tapCont:'Touchez pour continuer', tiers:['BIG WIN','MEGA WIN','EPIC WIN','LÉGENDAIRE'], best:'(meilleur)', symbol:'Symbole',
    replayDone:'Rejeu terminé', replayAgain:'Revoir', session:'Session', net:'Net',
    err:{ ERR_IPB:'Solde insuffisant.', ERR_IS:'Votre session a expiré. Rechargez le jeu.', ERR_ATE:'Échec de l’authentification. Rechargez le jeu.', ERR_GLE:'Limite de jeu atteinte.', ERR_LOC:'Ce jeu n’est pas disponible dans votre pays.', ERR_MAINTENANCE:'Le jeu est en maintenance. Réessayez plus tard.', def:'Problème de connexion. Réessayez.' },
    rules:(f)=>`<h2>Règles</h2>
      <p>Grille de 7 × 7. Un groupe de <b>5 symboles identiques ou plus</b>, reliés horizontalement ou verticalement, paie selon sa taille. Le tableau donne les gains pour votre mise actuelle de <b>${f.bet}</b> : chaque symbole en plus rapporte davantage, jusqu'à 15 et plus.</p>
      ${f.table}
      <h3>Cascades</h3><p>Les symboles gagnants explosent, ceux du dessus tombent et de nouveaux arrivent. Tant qu'un groupe se forme, ça continue.</p>
      <h3>Cases multiplicatrices</h3><ul><li>Dès qu'un symbole gagnant explose sur une case, elle devient <b>x2</b>.</li><li>Chaque nouvelle explosion la double : x4, x8, x16… jusqu'à x${MAX_MULT}.</li><li>Un groupe posé sur des cases multiplicatrices additionne leurs valeurs (x4 + x8 = ×12) et multiplie son gain.</li><li>En jeu de base, la grille se vide à chaque spin. En free spins, les cases restent jusqu'à la fin du bonus.</li></ul>
      ${f.ladder}
      <h3>Free spins</h3><p>${f.scatter} 3 Bonus = 10 spins · 4 = 12 · 5 = 15 · 6 = 20 · 7+ = 30. Pendant le bonus, 3 Bonus ou plus ajoutent ${RETRIGGER} spins. Un bonus rapporte toujours au moins ${MIN_BONUS_X} fois la mise.</p>
      ${f.buy}
      <h3>Gain maximum</h3><p>Les gains sont plafonnés à <b>${MAX_WIN_X.toLocaleString('fr-FR')} fois la mise</b> (${f.maxwin}). Dès qu'il est atteint, la partie s'arrête et le gain maximum est payé.</p>
      <h3>Taux de retour</h3><p>Le taux de retour théorique est de <b>${RTP_TEXT.replace('.',',')}</b> pour le jeu de base et pour les deux achats de bonus.</p>
      <p style="color:var(--mute);font-size:13px">Tout dysfonctionnement annule les parties et les gains.${f.space?' Raccourci : Espace pour lancer.':''}</p>`,
    rulesBuy:(a,b)=>`<h3>Achat du bonus</h3><p>Bonus : ${a} (100 fois la mise). Super bonus, toutes les cases à x2 : ${b} (300 fois la mise).</p>`, close:'Fermer' }
};
const T = I18N[LANG];
const TIERS = [{x:20},{x:50},{x:100},{x:250}].map((t,i)=>({x:t.x,label:T.tiers[i]}));

''')

# thème fixe : Halloween uniquement
sub("    names:['Chaudron','Citrouille','Crâne','Fantôme','Chauve-souris','Potion','Araignée','Lune de sang'],",
    "    names: LANG==='fr' ? ['Chaudron','Citrouille','Crâne','Fantôme','Chauve-souris','Potion','Araignée','Lune de sang'] : ['Cauldron','Pumpkin','Skull','Ghost','Bat','Potion','Spider','Blood moon'],")
sub("let themeId = 'classic';\ntry { const t=localStorage.getItem('cb-theme'); if(THEMES[t]) themeId=t; } catch(e){}", "let themeId = 'halloween';")
sub("  try{ localStorage.setItem('cb-theme',id); }catch(e){}\n", "")
sub("  document.title = T.logo.map(w=>w[0]+w.slice(1).toLowerCase()).join(' ');\n", "")

# ------------------------------------------------------------------ logique locale supprimée (le moteur s'en charge)
region('/* ============ RNG & LOGIQUE ============ */', '/* ============ ÉTAT ============ */', '''/* ============ ALÉATOIRE (effets visuels uniquement) ============ */
function rnd(){ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }

''')

# ------------------------------------------------------------------ état, devise, format
sub("let balance = START_BALANCE, betIdx = 3,", "let balance = DEMO_BALANCE, betIdx = 5,")
sub("try { const b = parseFloat(localStorage.getItem('cb-balance-v3')); if (isFinite(b) && b >= 0) balance = b; } catch(e){}\n", "")
sub('''const sp = t => t.replace(/[\\u202f\\u00a0]/g,'\\u00a0');
const fmt = n => sp(n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}));
const fmtPay = n => n<100 ? fmt(n) : sp(Math.round(n).toLocaleString('fr-FR'));''',
'''const sp = t => t.replace(/[\\u202f\\u00a0]/g,'\\u00a0');
/* devises Stake Engine : symbole, décimales, symbole après le montant */
const CUR_META = {USD:['$',2],CAD:['CA$',2],JPY:['¥',0],EUR:['€',2],RUB:['₽',2],CNY:['CN¥',2],PHP:['₱',2],INR:['₹',2],IDR:['Rp',0],KRW:['₩',0],BRL:['R$',2],MXN:['MX$',2],DKK:['KR',2,1],PLN:['zł',2,1],VND:['₫',0,1],TRY:['₺',2],CLP:['CLP',0,1],ARS:['ARS',2,1],PEN:['S/',2,1],XGC:['GC',2],XSC:['SC',2]};
let CURRENCY = null;                     // null = démo (pas de symbole)
const LOCALE = LANG==='fr' ? 'fr-FR' : 'en-US';
function money(n, dec){ const m = CURRENCY ? (CUR_META[CURRENCY] || [CURRENCY,2,1]) : null; const d = dec ?? (m ? m[1] : 2);
  const s = sp(n.toLocaleString(LOCALE,{minimumFractionDigits:d,maximumFractionDigits:d}));
  return !m ? s : m[2] ? s+' '+m[0] : m[0]+s; }
const fmt = n => money(n);
const fmtPay = n => n<100 ? money(n) : money(Math.round(n), 0);''')

# ------------------------------------------------------------------ grille aléatoire de départ supprimée
region('function randomGrid(forceScatters=0){', 'async function dropNewGrid(g){', '')

# ------------------------------------------------------------------ lecture des événements
region('/* Une cascade complète : renvoie le gain total du spin */', '/* compteur qui grimpe */', r'''/* ============ LECTURE D'UNE PARTIE (liste d'événements) ============ */
const cellRC = i => [(i / COLS) | 0, i % COLS];
const boardOf = rows => rows.map(s => [...s].map(Number));
let lastWins = [];

async function showWinStep(e, b, step){
  symsEl.classList.add('dimming');
  lastWins = e.wins;
  for(const w of e.wins){
    const cells = w.c.map(cellRC);
    for(const [r,c] of cells){ grid[r][c].el.classList.add('win'); setWinLook(grid[r][c].el, w.s, true); }
    showFloat(cells, w.w/10*b, w.m, w.b/10*b);
  }
  SFX.win(step);
  if(step>=2) showCombo(step);
  if(step>=3 || e.stepWin>=200){ const bw=$('boardWrap'); bw.classList.remove('bshake'); void bw.offsetWidth; bw.classList.add('bshake'); }
  await sleep(480);
}
function clearWinLook(){ symsEl.classList.remove('dimming'); for(const row of grid) for(const g of row) if(g) g.el.classList.remove('win'); }

async function applyMults(cells){
  let maxUp=0;
  for(const [i,v] of cells){ const [r,c]=cellRC(i); spots[r][c]=v; renderSpot(r,c,true); maxUp=Math.max(maxUp,v); }
  if(maxUp) SFX.mult(maxUp);
  updateHeat();
  await sleep(220);
}

async function animateTumble(e){
  const big = new Set(lastWins.map(w => w.c[(w.c.length/2)|0]));
  const gone = new Set(e.removed);
  for(const i of e.removed){ const [r,c]=cellRC(i), g=grid[r][c]; g.el.classList.remove('win'); g.el.classList.add('pop'); const [x,y]=cellCenter(r,c); explodeFX(x,y,g.s,big.has(i)); }
  SFX.pop(); symsEl.classList.remove('dimming');
  await sleep(170);
  for(let c=0;c<COLS;c++){
    const keep=[]; for(let r=ROWS-1;r>=0;r--){ if(gone.has(r*COLS+c)) grid[r][c].el.remove(); else keep.push(grid[r][c]); }
    const missing=ROWS-keep.length; if(!missing) continue;
    let r=ROWS-1;
    for(const it of keep){ const from=parseFloat(it.el.style.transform.match(/-?[\d.]+/)[0])/100; if(from!==r) place(it.el,r,(turbo?110:150)+(r-from)*(turbo?18:28),c*12); grid[r][c]=it; r--; }
    for(let tr=0;tr<missing;tr++){ const s=+e.add[c][tr], el=makeSym(s,c); place(el,tr-missing-1); symsEl.appendChild(el); grid[tr][c]={s,el}; }
  }
  void symsEl.offsetWidth;
  for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++){ const el=grid[r][c].el; const cur=parseFloat(el.style.transform.match(/-?[\d.]+/)[0])/100; if(cur<0) place(el,r,(turbo?170:260),c*15+(ROWS-r)*8); }
  await sleep(360);
  SFX.land(3);
}

async function celebrateScatters(e){
  const els = e.cells.map(i => { const [r,c]=cellRC(i); return grid[r][c].el; });
  els.forEach(el=>el.classList.add('schit')); SFX.trigger(); await sleep(900); els.forEach(el=>el.classList.remove('schit'));
}

/* Joue une partie complète. Renvoie le gain total (× mise). */
async function playBook(events, b, mode){
  const bought = !!(CFG.MODES[mode] && CFG.MODES[mode].buy);
  let spinWin=0, spinOpen=false, step=0, shown=0, inBonus=false, fsTotal=0, fsLeft=0, final=0, maxed=false, hadBonus=false;
  const banner=()=>{ $('fsLeft').textContent=T.left(fsLeft); $('fsTotal').textContent=fmt(fsTotal/10*b); };
  const closeSpin=async()=>{ if(spinOpen){ spinOpen=false; clearWinLook(); if(spinWin>0 && !maxed) await bigWin(spinWin/10*b, b); } };
  for(const e of events){
    switch(e.type){
      case 'reveal':
        floatsEl.innerHTML=''; $('msg').classList.remove('hype');
        if(!inBonus){ $('winAmt').textContent=''; $('msg').textContent=T.luck; }
        { const bw=$('boardWrap'); bw.classList.remove('flash'); void bw.offsetWidth; bw.classList.add('flash'); }
        SFX.whoosh();
        await dropNewGrid(boardOf(e.board));
        spinWin=0; step=0; spinOpen=true; shown=0;
        break;
      case 'winInfo':
        step++;
        await showWinStep(e, b, step);
        if(inBonus){ fsTotal+=e.stepWin; banner(); }
        countTo($('winAmt'), shown/10*b, (inBonus?fsTotal:e.spinWin)/10*b, 420); shown=inBonus?fsTotal:e.spinWin;
        hypeMsg(e.spinWin/10);
        spinWin=e.spinWin;
        break;
      case 'winCap': maxed=true; clearWinLook(); break;
      case 'multUpdate': await applyMults(e.cells); break;
      case 'tumble': await animateTumble(e); break;
      case 'scatters': await celebrateScatters(e); break;
      case 'freeSpinTrigger':
        await closeSpin();
        hadBonus=true; autoLeft=0; $('autoSel').value='0';
        inFS=true; updateUI();
        spots=zero(e.startMult); renderAllSpots();
        await modal(`<div class="kicker">${bought?T.bought:T.trig}</div><div class="orbs">${Array.from({length:Math.min(e.scatters,7)},()=>symSVG(7)).join('')}</div><h2>${T.spins(e.count)}</h2>
          <p>${T.intro(e.scatters)}</p>${e.startMult?'<p>'+T.introSup+'</p>':''}`, [[T.start,1]]);
        document.body.classList.add('fs'); $('fsBanner').hidden=false; Music.setIntensity(true);
        inBonus=true; fsTotal=0; fsLeft=e.count; banner();
        break;
      case 'freeSpin':
        if(e.number>1){ await closeSpin(); await sleep(250); }
        fsLeft=e.left; banner();
        break;
      case 'freeSpinRetrigger':
        await closeSpin();
        fsLeft=e.left; banner();
        await autoClose(`<div class="kicker">${T.retrig}</div><h2>+${e.added} FREE SPINS</h2>`, 1800);
        break;
      case 'freeSpinEnd':
        await closeSpin();
        fsTotal=e.total; banner();
        if(e.maxed) await maxWinScreen(e.total/10*b);
        await modal(`<div class="kicker">${e.maxed?T.maxed:T.over}</div><div class="big">${fmt(e.total/10*b)}</div><p class="endline">${T.inSpins(e.played)}</p>`, [[T.cont,1]]);
        document.body.classList.remove('fs'); $('fsBanner').hidden=true; Music.setIntensity(false);
        inFS=false; inBonus=false; resetSpots();
        break;
      case 'finalWin': final=e.amount; break;
    }
  }
  if(!hadBonus){ spinOpen && (spinOpen=false, clearWinLook()); if(maxed) await maxWinScreen(final/10*b); else await bigWin(final/10*b, b); }
  $('msg').textContent = final>0 ? (hadBonus?T.bonusPaid:T.win) : T.nowin;
  $('winAmt').textContent = final>0 ? fmt(final/10*b) : '';
  return final/10;
}

''')
sub("function hypeMsg(x){ const m=$('msg'); const t = x>=100?'ÉNORME !': x>=50?'GROS GAIN !': x>=10?'JOLI GAIN !':'Gain';",
    "function hypeMsg(x){ const m=$('msg'); const t = x>=100?T.huge: x>=50?T.big: x>=10?T.nice:T.win;")
sub("c.textContent=`CASCADE ×${step}`;", "c.textContent=T.cascade(step);")

# ------------------------------------------------------------------ interface
sub("function setBalance(v){ balance=Math.max(0,Math.round(v*100)/100); $('balance').textContent=fmt(balance); try{ localStorage.setItem('cb-balance-v3',String(balance)); }catch(e){} updateUI(); }",
    "function setBalance(v){ balance=Math.max(0,Math.round(v*1e6)/1e6); $('balance').textContent=fmt(balance); updateUI(); }")
sub("  $('buyStd').disabled = busy||inFS||balance<b*BUY_STD; $('buySup').disabled = busy||inFS||balance<b*BUY_SUP;",
    "  $('buyStd').disabled = busy||inFS||balance<b*BUY_STD||REPLAY; $('buySup').disabled = busy||inFS||balance<b*BUY_SUP||REPLAY;")
sub("  sb.disabled = inFS || (busy && autoLeft===0);", "  sb.disabled = inFS || REPLAY || (busy && autoLeft===0);")
sub("autoLeft>0 ? `Arrêter l'auto (${autoLeft} restants)` : 'Lancer (Espace)'", "autoLeft>0 ? 'Stop autoplay ('+autoLeft+')' : 'Spin'")
sub("  $('reload').hidden = balance >= START_BALANCE; $('reload').disabled = busy||inFS;", "  $('reload').hidden = Backend.live || REPLAY || balance >= BETS[0]; $('reload').disabled = busy||inFS;")
sub("ov.innerHTML='<div><div class=\"tier\" id=\"bwTier\"></div><div class=\"amt\" id=\"bwAmt\">0,00</div><div class=\"hint\">Touchez pour passer</div></div>';",
    "ov.innerHTML='<div><div class=\"tier\" id=\"bwTier\"></div><div class=\"amt\" id=\"bwAmt\"></div><div class=\"hint\">'+T.skip+'</div></div>';")
sub("<div class=\"hint\">Touchez pour continuer</div>", "<div class=\"hint\">${T.tapCont}</div>")

# ------------------------------------------------------------------ déroulement d'une partie (serveur Stake ou démo)
region('/* ============ BONUS ============ */', 'function showRules(){', r'''/* ============ SERVEUR DE JEU (Stake Engine RGS) ============ */
const REPLAY = Q.get('replay') === 'true';
const JUR = {};                      // options imposées par la juridiction (authenticate)
const Backend = (() => {
  const sid = Q.get('sessionID'), rgs = Q.get('rgs_url');
  const live = !!(sid && rgs) && !REPLAY;
  const base = rgs ? (/^https?:\/\//.test(rgs) ? rgs : 'https://' + rgs) : '';
  let round = null;
  async function call(method, path, body){
    let r, d = {};
    try { r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
    catch(e){ const er = new Error('network'); er.code = 'NET'; throw er; }
    try { d = await r.json(); } catch(e){}
    if(!r.ok || d.error){ const er = new Error(d.message || d.error || ('HTTP ' + r.status)); er.code = d.error || d.code || ('HTTP' + r.status); throw er; }
    return d;
  }
  const eventsOf = rd => Array.isArray(rd && rd.state) ? rd.state : (rd && rd.state && rd.state.events) || [];
  return {
    live,
    async authenticate(){
      const d = await call('POST', '/wallet/authenticate', { sessionID: sid, language: LANG });
      round = d.round || null;
      return d;
    },
    pendingRound(){ return round && round.active && eventsOf(round).length ? { events: eventsOf(round), mode: round.mode, amount: round.amount } : null; },
    async play(mode, b){
      if(!live){ const r = ENG.playRound(mode); setBalance(balance - b * CFG.MODES[mode].cost); round = { active: r.payoutX > 0, payoutX: r.payoutX, bet: b }; return r.events; }
      const d = await call('POST', '/wallet/play', { sessionID: sid, mode, amount: Math.round(b * 1e6), currency: CURRENCY });
      if(d.balance) setBalance(d.balance.amount / 1e6);
      round = d.round;
      const ev = eventsOf(d.round);
      if(!ev.length){ const er = new Error('empty round'); er.code = 'ERR_GEN'; throw er; }
      return ev;
    },
    async endRound(){
      if(!live){ if(round && round.payoutX) setBalance(balance + round.payoutX * round.bet); round = null; return; }
      if(round && round.active){ const d = await call('POST', '/wallet/end-round', { sessionID: sid }); if(d.balance) setBalance(d.balance.amount / 1e6); }
      round = null;
    },
    async balance(){ if(!live) return; try{ const d = await call('POST', '/wallet/balance', { sessionID: sid }); if(d.balance && !busy) setBalance(d.balance.amount / 1e6); }catch(e){} },
    async replay(){
      const p = k => encodeURIComponent(Q.get(k) || '');
      const d = await call('GET', `/bet/replay/${p('game')}/${p('version')}/${p('mode')}/${p('event')}`);
      return eventsOf(d.round || d);
    }
  };
})();

function showError(err){
  const code = err && err.code, txt = (code && T.err[code]) || T.err.def;
  console.error(err);
  modal(`<h2 style="font-size:26px">${txt}</h2>${code && code!=='NET' ? `<p style="color:var(--mute);font-size:13px">${code}</p>` : ''}`, [[T.close,1]]);
}

/* session : durée et position nette (si la juridiction l'exige) */
let sessStart = Date.now(), net = 0;
function paintSession(){
  if(!(JUR.displaySessionTimer || JUR.displayNetPosition)) return;
  const el = $('sess'); el.hidden = false;
  const s = Math.floor((Date.now()-sessStart)/1000), hh = String(Math.floor(s/3600)).padStart(2,'0'), mm = String(Math.floor(s/60)%60).padStart(2,'0'), ss = String(s%60).padStart(2,'0');
  el.textContent = [JUR.displaySessionTimer ? `${T.session} ${hh}:${mm}:${ss}` : '', JUR.displayNetPosition ? `${T.net} ${net>=0?'+':''}${fmt(net)}` : ''].filter(Boolean).join(' · ');
}
setInterval(paintSession, 1000);

/* une partie : demande au serveur, animation, fin de partie */
async function playRound(mode, b, resumeEvents){
  busy=true; resetSpots(); updateUI();
  const t0 = Date.now();
  let events = resumeEvents;
  if(!events){
    try { events = await Backend.play(mode, b); }
    catch(err){ busy=false; autoLeft=0; $('autoSel').value='0'; updateUI(); showError(err); return false; }
  }
  const won = await playBook(events, b, mode);
  const minMs = +JUR.minimumRoundDuration || 0, minDur = minMs > 0 && minMs < 100 ? minMs*1000 : minMs;
  if(Date.now()-t0 < minDur) await new Promise(r=>setTimeout(r, minDur-(Date.now()-t0)));
  try { await Backend.endRound(); } catch(err){ showError(err); }
  net += won*b - (resumeEvents ? 0 : b*CFG.MODES[mode].cost);
  busy=false; updateUI(); paintSession();
  return true;
}

/* ============ ACTIONS ============ */
async function spin(){
  if(busy||inFS||REPLAY) return;
  const b=bet();
  if(balance<b){ showError({code:'ERR_IPB'}); autoLeft=0; updateUI(); return; }
  const ok = await playRound('base', b);
  if(ok && autoLeft>0){
    autoLeft--;
    if(autoLeft===0){ $('autoSel').value='0'; updateUI(); return; }
    updateUI(); await sleep(150);
    if(autoLeft>0 && !busy && !inFS) spin();
  }
}
async function buy(sup){
  if(busy||inFS||REPLAY||JUR.disabledBuyFeature) return;
  const b=bet(), mode=sup?'super':'bonus', price=b*CFG.MODES[mode].cost;
  const ok=await modal(`<div class="kicker">${sup?T.sup:T.buy}</div><h2>${fmt(price)}</h2><p>${T.confirm(fmt(b),sup)}</p>`, [[T.cancel,false,'ghost'],[T.buyBtn,true]]);
  if(!ok) return;
  if(balance<price){ showError({code:'ERR_IPB'}); return; }
  autoLeft=0; $('autoSel').value='0';
  await playRound(mode, b);
}

''')

# ------------------------------------------------------------------ règles
region('function showRules(){', '/* ============ BRANCHEMENTS ============ */', r'''function showRules(){
  const b=bet();
  const head='<tr><th>'+T.symbol+'</th>'+[5,6,7,8,9,10,11,12,13,14,'15+'].map(n=>`<th>${n}</th>`).join('')+'</tr>';
  const rows=PAYTABLE.map((p,i)=>`<tr><td>${symSVG(i)} ${NAMES[i]}${i===0?' <b style="color:var(--gold)">'+T.best+'</b>':''}</td>${p.map(v=>`<td>${fmtPay(v*b)}</td>`).join('')}</tr>`).join('');
  const ladder='<div class="ladder">'+Object.entries(MULT_COLORS).map(([v,c])=>`<span style="background:${c}">x${v}</span>`).join('')+'</div>';
  modal(T.rules({ bet:fmt(b), table:`<div class="tablewrap"><table class="pay">${head}${rows}</table></div>`, ladder,
    scatter:symSVG(7).replace('<svg','<svg style="width:28px;height:28px;vertical-align:middle"'),
    buy: JUR.disabledBuyFeature ? '' : T.rulesBuy(fmt(BUY_STD*b), fmt(BUY_SUP*b)), maxwin:fmt(MAX_WIN_X*b), space:!JUR.disabledSpacebar }), [[T.close,1]], true);
}

''')

# ------------------------------------------------------------------ branchements
sub("$('reload').onclick=()=>{ setBalance(START_BALANCE); toast('Solde rechargé : '+fmt(START_BALANCE)); };", "$('reload').onclick=()=>{ if(!Backend.live) setBalance(DEMO_BALANCE); };")
sub("addEventListener('keydown',e=>{ if(e.code==='Space' && !document.querySelector('.ov,.bigwin')",
    "addEventListener('keydown',e=>{ if(e.code==='Space' && !JUR.disabledSpacebar && !document.querySelector('.ov,.bigwin')")
sub("$('themeSel').onchange=e=>{ applyTheme(e.target.value); SFX.click(); };\n", "")

# ------------------------------------------------------------------ tableau des gains + démarrage
sub("    + `<div class=\"vrow\"><span>${symSVG(7)}</span><span class=\"sc\">3+ = free spins</span></div>`;\n  $('valBet').textContent=fmt(b);",
    "    + `<div class=\"vrow\"><span>${symSVG(7)}</span><span class=\"sc\">3+ = free spins</span></div>`;\n  $('valBet').textContent=fmt(b);")
region('/* grille de départ, posée sans gain */', '</script>', r'''/* ============ DÉMARRAGE ============ */
function applyLang(){
  const set=(id,html)=>{ const el=$(id); if(el) el.innerHTML=html; };
  set('tBalance',T.balance); set('tBuy',T.buy); set('tBuyD',T.buyD); set('tSup',T.sup); set('tSupD',T.supD); set('tPay',T.pay); set('tPaySub',T.paySub);
  set('tMax',T.max); set('tNote', Backend.live ? T.note : T.note+' '+T.demo); set('tFsWin',T.fsWin); set('tHeat',T.heat); set('tBet',T.bet); set('tSpeed',T.speed); set('msg',T.hint);
  document.documentElement.lang = LANG;
}
function applyJurisdiction(){
  if(JUR.disabledTurbo){ $('turboBtn').closest('.grp').hidden = true; turbo=false; }
  if(JUR.disabledAutoplay){ $('autoSel').closest('.grp').hidden = true; autoLeft=0; }
  if(JUR.disabledBuyFeature){ $('buyStd').hidden = true; $('buySup').hidden = true; }
}
function startGrid(){
  let ev; do { ev = ENG.playRound('base').events; } while(ev.length!==2);     // une grille sans gain ni Bonus
  const g = boardOf(ev[0].board);
  grid=Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{ const el=makeSym(g[r][c],c); place(el,r); symsEl.appendChild(el); return {s:g[r][c],el}; }));
}
(async function init(){
  applyLang(); startGrid(); renderAllSpots(); applyTheme(themeId);
  if(REPLAY){
    const amount = (+Q.get('amount') || 1e6) / 1e6, mode = Q.get('mode') || 'base';
    BETS=[amount]; betIdx=0; CURRENCY = Q.get('currency') || null; setBalance(0); $('balance').textContent='—';
    document.querySelector('.controls').style.visibility='hidden'; $('buyStd').hidden=true; $('buySup').hidden=true;
    const run = async () => { try { const ev = await Backend.replay(); busy=true; resetSpots(); await playBook(ev, amount, mode.toLowerCase()); busy=false; }
      catch(err){ showError(err); return; }
      if(await modal(`<h2>${T.replayDone}</h2>`, [[T.replayAgain,1]])) run(); };
    run(); return;
  }
  if(!Backend.live){ setBalance(DEMO_BALANCE); return; }
  try {
    const d = await Backend.authenticate();
    CURRENCY = d.balance && d.balance.currency || null;
    const c = d.config || {};
    Object.assign(JUR, c.jurisdiction || {});
    if(Array.isArray(c.betLevels) && c.betLevels.length){ BETS = c.betLevels.map(v => v/1e6); const def = BETS.indexOf((c.defaultBetLevel||0)/1e6); betIdx = def>=0 ? def : Math.min(BETS.length-1, BETS.findIndex(v=>v>=1)>=0?BETS.findIndex(v=>v>=1):0); }
    applyJurisdiction(); applyLang();
    setBalance(d.balance ? d.balance.amount/1e6 : 0);
    setInterval(()=>Backend.balance(), 60000);
    const pending = Backend.pendingRound();
    if(pending){
      const b = pending.amount ? pending.amount/1e6 : bet(); const i = BETS.indexOf(b); if(i>=0) betIdx=i;
      await playRound(String(pending.mode||'base').toLowerCase(), b, pending.events);
    }
  } catch(err){ showError(err); }
  paintSession();
})();
''')

sub("function buildValues(){\n  const b=bet(), n = v => fmtPay(v*b);", "function buildValues(){\n  const b=bet(), n = v => { const x=v*b, m=CURRENCY?(CUR_META[CURRENCY]||[0,2]):[0,2]; return sp(x.toLocaleString(LOCALE,{minimumFractionDigits:x<100?m[1]:0,maximumFractionDigits:x<100?m[1]:0})); };")

# ------------------------------------------------------------------ corrections de la revue Engine
import importlib.util
_spec = importlib.util.spec_from_file_location('stake_fixes', os.path.join(HERE, 'stake_fixes.py'))
_fx = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_fx)
s = _fx.apply(s)
_spec2 = importlib.util.spec_from_file_location('stake_polish', os.path.join(HERE, 'stake_polish.py'))
_po = importlib.util.module_from_spec(_spec2); _spec2.loader.exec_module(_po)
s = _po.apply(s)

# ------------------------------------------------------------------ écriture
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
shutil.copy(os.path.join(GAME, 'stake', 'engine.js'), os.path.join(OUT, 'engine.js'))
dst = os.path.join(OUT, 'theme', 'halloween')
if os.path.exists(dst): shutil.rmtree(dst)
shutil.copytree(os.path.join(GAME, 'theme', 'halloween'), dst, ignore=shutil.ignore_patterns('hires','ai-source'))
fdst = os.path.join(OUT, 'theme', 'fonts')
if os.path.exists(fdst): shutil.rmtree(fdst)
shutil.copytree(os.path.join(GAME, 'stake', 'fonts'), fdst)
print('front-end écrit dans', OUT)
