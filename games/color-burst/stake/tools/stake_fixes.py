"""
Corrections de conformité Stake Engine, appliquées au front-end par build_frontend.py.
Suite à la revue Engine (checklist) : mise en page sans défilement (desktop, mobile, popouts),
zoom désactivé, petits montants, aide sur chaque commande, anglais complet, vocabulaire social,
devises GC/SC, replay (bouton Play, bandeau coût, résultat visible), erreurs bloquantes,
paramètres de mise, barre espace, confirmation de l'autoplay, avertissement, polices embarquées.

Usage : appelé par build_frontend.py → apply(s) renvoie le HTML corrigé.
"""


def apply(s):
    def sub(old, new, count=1):
        nonlocal s
        assert old in s, 'stake_fixes : introuvable : ' + old[:90]
        s = s.replace(old, new, count)

    def region(start, end, new):
        nonlocal s
        a = s.index(start); b = s.index(end, a)
        s = s[:a] + new + s[b:]

    # ---------------------------------------------------------------- [223] zoom, polices embarquées
    sub('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">')
    sub('''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Outfit:wght@400;600;800&display=swap">''',
        '''<style>
/* polices embarquées (licence SIL OFL) : aucune ressource externe */
@font-face{font-family:'Lilita One';font-style:normal;font-weight:400;font-display:swap;src:url(theme/fonts/lilita-one-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Lilita One';font-style:normal;font-weight:400;font-display:swap;src:url(theme/fonts/lilita-one-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Outfit';font-style:normal;font-weight:100 900;font-display:swap;src:url(theme/fonts/outfit-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Outfit';font-style:normal;font-weight:100 900;font-display:swap;src:url(theme/fonts/outfit-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
</style>''')

    # ---------------------------------------------------------------- [227][195][243][193][194] mise en page
    css = r'''
/* ===== Mise en page Stake Engine : tout tient dans la fenêtre, aucun défilement ===== */
html,body{height:100%;overflow:hidden;touch-action:manipulation;overscroll-behavior:none;-webkit-user-select:none;user-select:none}
.app{--sideW:clamp(78px,17vw,230px);--ctrlW:clamp(88px,15vw,210px);--topH:clamp(28px,7.5vh,54px);--wbH:clamp(14px,4.5vh,32px);--gap:clamp(4px,1.1vmin,12px);
  height:100%;min-height:0;max-width:none;margin:0;box-sizing:border-box;padding:var(--gap) calc(var(--gap)*1.5);gap:var(--gap);
  display:grid;grid-template-columns:var(--sideW) minmax(0,1fr) var(--ctrlW);grid-template-rows:var(--topH) minmax(0,1fr);grid-template-areas:"top top top" "side machine ctrl"}
.stage{display:contents}
header.top{grid-area:top;display:flex!important;align-items:center;gap:var(--gap);min-height:0;flex-wrap:nowrap}
header.top .actions{display:flex!important;margin-left:auto;gap:var(--gap);align-items:center}
.logo{font-size:clamp(14px,min(4.6vh,4vw),34px)!important;white-space:nowrap}
.pill{padding:clamp(2px,.6vh,6px) clamp(6px,1vw,10px) clamp(2px,.6vh,6px) clamp(8px,1.4vw,16px);gap:6px}
.pill small{display:inline!important;font-size:clamp(8px,1.6vh,11px)}
.pill strong{font-size:clamp(11px,2.6vh,18px)!important;white-space:nowrap}
.icon-btn{width:clamp(22px,5.4vh,38px)!important;height:clamp(22px,5.4vh,38px)!important;font-size:clamp(11px,2.4vh,16px)}
.icon-btn svg{width:55%;height:55%}
.side{grid-area:side;order:0!important;display:flex;flex-direction:column!important;flex-wrap:nowrap!important;justify-content:center;min-width:0;min-height:0;gap:var(--gap)}
.side .buy{flex:0 0 auto!important;padding:clamp(4px,1.4vmin,14px);border-radius:clamp(8px,1.8vmin,18px)}
.buy .k{font-size:clamp(10px,2.7vmin,22px)}
.buy .d{font-size:clamp(9px,1.7vmin,12.5px);margin:clamp(2px,.6vmin,6px) 0 clamp(3px,.9vmin,10px)}
.buy .p{font-size:clamp(9px,1.9vmin,15px);padding:clamp(1px,.4vmin,4px) clamp(5px,1vmin,10px)}
.values,.note{display:none!important}
.machine{grid-area:machine;min-width:0;min-height:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;position:relative}
.board-wrap{width:min(calc(100vh - var(--topH) - var(--wbH) - var(--gap)*4 - 6px), calc(100vw - var(--sideW) - var(--ctrlW) - var(--gap)*7))!important;
  min-width:0!important;max-width:100%;height:auto;padding:clamp(3px,.9vmin,10px)!important;border-radius:clamp(10px,2.4vmin,26px)!important}
.board{border-radius:clamp(7px,1.7vmin,18px)!important}
.winbar{height:var(--wbH);min-height:0!important;width:100%;max-width:none;padding:0 4px}
.winbar .msg{font-size:clamp(9px,1.9vh,14px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.winbar .amt{font-size:clamp(12px,3.4vh,26px)}
.fs-banner{position:absolute;left:0;right:0;bottom:0;height:var(--wbH);max-width:none;padding:0 8px;border-radius:10px;z-index:9;box-sizing:border-box}
.fs-banner .lab{font-size:clamp(7px,1.4vh,11px)}
.fs-banner .val{font-size:clamp(10px,2.6vh,22px)}
body.fs .winbar{visibility:hidden}
.heat{font-size:clamp(8px,1.6vh,12px);top:calc(-1 * clamp(8px,1.8vh,14px));padding:clamp(1px,.4vh,4px) 10px}
.heat b{font-size:clamp(10px,2.2vh,16px)}
.controls{grid-area:ctrl;order:0!important;position:static!important;display:flex;flex-direction:column;flex-wrap:nowrap!important;justify-content:center;align-items:stretch;
  gap:clamp(4px,1.4vh,14px);padding:clamp(4px,1.2vmin,12px)!important;min-width:0;min-height:0;border-radius:clamp(10px,2vmin,22px)}
.controls .grp{align-items:center}
.controls .grp>small{font-size:clamp(7px,1.4vh,10.5px)}
.bet{gap:clamp(2px,.6vmin,6px)!important}
.bet output{min-width:clamp(34px,7vmin,72px)!important;font-size:clamp(10px,2.4vmin,18px)!important}
.round{width:clamp(20px,4.6vmin,36px)!important;height:clamp(20px,4.6vmin,36px)!important;font-size:clamp(12px,2.6vmin,20px)!important}
.spin-holder{display:flex;justify-content:center}
.spin{width:clamp(42px,15vmin,90px)!important;height:clamp(42px,15vmin,90px)!important}
.spin svg{width:45%!important;height:45%!important}
.spin .cnt{font-size:clamp(14px,4vmin,26px)}
.opts{display:flex;flex-direction:column!important;gap:clamp(3px,.8vmin,6px)!important;align-items:stretch}
.opts .grp{flex-direction:row!important;gap:4px;justify-content:center}
.opts .grp>small{display:none!important}
.opts select,.opts .toggle{width:100%;padding:clamp(3px,.8vmin,7px) clamp(4px,1vmin,10px)!important;font-size:clamp(9px,1.8vmin,13px)!important}
/* très petite hauteur (popout 400×225) : on retire le superflu */
@media (max-height:300px){ .buy .d,.pill small,.controls .grp>small{display:none!important} .heat{display:none!important} }
@media (max-height:420px){ .buy .d{display:none!important} }
/* portrait (mobile) : grille en haut, commandes dessous, achats en bas */
@media (max-aspect-ratio: 9/10){
  .app{--ctrlH:clamp(64px,10vh,96px);--sideH:clamp(44px,7.5vh,72px);--topH:auto;
    grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) var(--ctrlH) var(--sideH);grid-template-areas:"top" "machine" "ctrl" "side"}
  header.top{flex-wrap:wrap!important}
  .board-wrap{width:min(calc(100vw - var(--gap)*3), calc(100vh - var(--ctrlH) - var(--sideH) - var(--wbH) - 120px))!important}
  .controls{flex-direction:row;justify-content:space-between;align-items:center}
  .controls>.grp{flex:0 0 auto}
  .opts{width:clamp(80px,26vw,130px)}
  .spin{width:clamp(48px,9vh,80px)!important;height:clamp(48px,9vh,80px)!important}
  .side{flex-direction:row!important;align-items:stretch}
  .side .buy{flex:1 1 0!important;display:flex;flex-direction:column;justify-content:center}
  .buy .d{display:none!important}
  .bet output{min-width:clamp(48px,14vw,72px)!important;font-size:clamp(13px,4vw,18px)!important}
  .round{width:clamp(28px,8vw,36px)!important;height:clamp(28px,8vw,36px)!important}
}
/* replay : pas de commandes ni d'achats */
body.replay .controls,body.replay .side{display:none!important}
body.replay .app{grid-template-columns:minmax(0,1fr);grid-template-areas:"top" "machine";grid-template-rows:var(--topH) minmax(0,1fr)}
body.replay .board-wrap{width:min(calc(100vh - var(--topH) - var(--wbH) - var(--gap)*4 - 46px), calc(100vw - var(--gap)*4))!important}
.rp-banner{position:absolute;left:50%;top:0;transform:translateX(-50%);z-index:12;white-space:nowrap;font-weight:800;font-size:clamp(9px,1.9vh,14px);letter-spacing:.04em;background:rgba(10,6,28,.92);border:1px solid var(--line);border-radius:999px;padding:3px 12px;color:#fff}
.rp-play{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:rgba(6,3,18,.55)}
.rp-play button{font-family:var(--display);font-size:clamp(18px,5vmin,36px);border:0;border-radius:999px;padding:.45em 1.4em;background:linear-gradient(180deg,#7dffb3,#14b866);color:#06331b;box-shadow:0 6px 0 #064d28}
.rp-end{position:absolute;left:50%;bottom:calc(var(--wbH) + 6px);transform:translateX(-50%);z-index:40;display:flex;gap:10px;align-items:center;background:rgba(10,6,28,.94);border:1px solid var(--gold);border-radius:999px;padding:6px 8px 6px 16px;font-weight:800;font-size:clamp(10px,2.2vh,16px);white-space:nowrap}
.rp-end button{border:0;border-radius:999px;padding:6px 14px;font-weight:800;background:var(--gold);color:#2a1600}
/* chargement et erreurs bloquantes */
.boot{position:fixed;inset:0;z-index:90;display:grid;place-items:center;background:rgba(6,3,18,.86);color:#fff;text-align:center;padding:16px;font-size:clamp(12px,2.6vmin,18px)}
.boot h2{font-family:var(--display);font-weight:400;font-size:clamp(18px,4.5vmin,34px);margin:0 0 8px}
.boot .spinner{width:clamp(28px,7vmin,48px);height:clamp(28px,7vmin,48px);border-radius:50%;border:4px solid rgba(255,255,255,.2);border-top-color:var(--gold);animation:orb 1s linear infinite;margin:0 auto 12px}
.card{max-height:calc(100% - 16px)!important}
.card.wide .ctrl-list{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:6px 0}
.card .ctrl-list b{white-space:nowrap}
'''
    sub('</style>\n</head>', css + '</style>\n</head>')

    # ---------------------------------------------------------------- en-tête : libellés et solde vides tant qu'on n'est pas authentifié
    sub('<strong id="balance">1 000 000,00</strong><button class="reload" id="reload" hidden aria-label="Recharger le solde"><span class="rl-t">Recharger</span><span class="rl-i">↻</span></button>',
        '<strong id="balance">—</strong><button class="reload" id="reload" hidden><span class="rl-t"></span><span class="rl-i">↻</span></button>')
    sub('<button class="icon-btn" id="musicBtn" aria-label="Musique" title="Musique" hidden>', '<button class="icon-btn" id="musicBtn" aria-label="Music" title="Music" hidden>')
    sub('<button class="icon-btn" id="muteBtn" aria-label="Couper le son" title="Son">', '<button class="icon-btn" id="muteBtn" aria-label="Sound" title="Sound">')
    sub('<button class="icon-btn" id="rulesBtn" aria-label="Règles et table des gains" title="Règles">?</button>', '<button class="icon-btn" id="rulesBtn" aria-label="Game rules" title="Game rules">?</button>')
    sub('<section class="values" aria-label="Valeur des symboles">', '<section class="values" aria-label="Symbol values">')
    sub('<button class="round" id="betDown" aria-label="Diminuer la mise">−</button>', '<button class="round" id="betDown" aria-label="Decrease">−</button>')
    sub('<button class="round" id="betUp" aria-label="Augmenter la mise">+</button>', '<button class="round" id="betUp" aria-label="Increase">+</button>')
    sub('<button class="spin" id="spinBtn" aria-label="Lancer (Espace)">', '<button class="spin" id="spinBtn" aria-label="Spin">')
    sub('<div class="board-wrap" id="boardWrap">', '<div class="rp-banner" id="rpBanner" hidden></div>\n      <div class="board-wrap" id="boardWrap">')

    # ---------------------------------------------------------------- [78] devises GC / SC
    sub("XGC:['GC',2],XSC:['SC',2]};", "XGC:['GC',2,1],XSC:['SC',2,1],XEC:['SC',2,1]};")

    # ---------------------------------------------------------------- [273] montants sous la précision de la devise
    sub("function money(n, dec){ const m = CURRENCY ? (CUR_META[CURRENCY] || [CURRENCY,2,1]) : null; const d = dec ?? (m ? m[1] : 2);",
        "function money(n, dec){ const m = CURRENCY ? (CUR_META[CURRENCY] || [CURRENCY,2,1]) : null; let d = dec ?? (m ? m[1] : 2);\n"
        "  if(n && dec===undefined && Math.abs(Math.round(n * 1e6) - n * 1e6) < 1e-4){ while(d < 6 && Math.abs(Math.round(n * 10 ** d) / 10 ** d - n) > 1e-9) d++; }   // 0,005 reste 0,005")
    sub("const fmtPay = n => n<100 ? money(n) : money(Math.round(n), 0);", "const fmtPay = n => n<100 ? money(n) : money(Math.round(n));")

    # ---------------------------------------------------------------- [239] textes restants en français
    sub("$('heatVal').textContent='×'+sum.toLocaleString('fr-FR');", "$('heatVal').textContent='×'+sum.toLocaleString(LOCALE);")
    sub("b.title = on?'Couper la musique':'Activer la musique';", "b.title = on?T.musicOff:T.musicOn; b.setAttribute('aria-label', b.title);")
    sub("$('muteBtn').setAttribute('aria-label', muted?'Activer le son':'Couper le son'); }", "$('muteBtn').setAttribute('aria-label', muted?T.soundOn:T.soundOff); $('muteBtn').title = muted?T.soundOn:T.soundOff; }")
    sub("title=\"${NAMES[i]}${i===0?' (meilleur)':''}\"", "title=\"${NAMES[i]}${i===0?' '+T.best:''}\"")
    sub("$('msg').textContent = final>0 ? (hadBonus?T.bonusPaid:T.win) : T.nowin;", "$('msg').textContent = final>0 ? (hadBonus?T.bonusDone:T.win) : T.nowin;")
    sub("  $('reload').hidden = Backend.live || REPLAY || balance >= BETS[0]; $('reload').disabled = busy||inFS;", "  $('reload').hidden = true;")
    sub("autoLeft>0 ? 'Stop autoplay ('+autoLeft+')' : 'Spin'", "autoLeft>0 ? T.stopAuto(autoLeft) : T.spinAria")

    # ---------------------------------------------------------------- textes : anglais / français, variante sociale complète
    region('/* ============ LANGUE ============ */', '/* ============ THÈMES', r'''/* ============ LANGUE ============ */
const Q = new URLSearchParams(location.search);
const LANG = (Q.get('lang') || navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
let SOC = Q.get('social') === 'true';          // aussi activé par config.jurisdiction.socialCasino (authenticate)
/* Vocabulaire neutre partout (pas de « pays/paid/payouts/money/gambling ») ; « bet/buy » seulement hors mode social. */
function makeT(soc){
  const en = {
    balance:'Balance', bet: soc?'Play amount':'Bet', buy:'Bonus', buyD:'10+ free spins, persistent multipliers.', sup:'Super bonus', supD:'10+ free spins, every cell starts at <b>x2</b>.',
    pay:'Symbol values', paySub:'By cluster size, for', max:'Max win:', speed:'Speed', note:'Theoretical RTP '+RTP_TEXT+'.', fsWin:'Bonus total', heat:'Multipliers in play',
    hint:'Form clusters of 5 or more matching symbols.', luck:'Good luck…', nowin:'No cluster this time.', win:'Win', nice:'NICE WIN!', big:'BIG WIN!', huge:'HUGE!', bonusDone:'Bonus complete!',
    left:n=>n+' left', trig:'Bonus triggered', bought:'Bonus started', spins:n=>n+' FREE SPINS',
    intro:n=>n+' Bonus symbols. Multipliers stay on the grid for the whole bonus and keep doubling.', introSup:'<b>Super bonus:</b> all 49 cells start at x2.', start:'Start',
    retrig:'Retrigger', over:'Bonus complete', maxed:'Max win reached', inSpins:n=>'in '+n+' free spin'+(n>1?'s':''), cont:'Continue',
    confirm:(b,sup)=>(soc?'For a play amount of ':'For a bet of ')+b+', you get <b>10 or more free spins</b>'+(sup?', with <b>every cell at x2</b> from the start':'')+'.', cancel:'Cancel', buyBtn: soc?'Start':'Buy',
    cascade:n=>'CASCADE ×'+n, skip:'Tap to skip', tapCont:'Tap to continue', tiers:['BIG WIN','MEGA WIN','EPIC WIN','LEGENDARY'], best:'(best)', symbol:'Symbol',
    replayDone:'Replay complete', replayAgain:'Watch again', replayPlay:'Play', replayWin:x=>'Win: '+x, replayBanner:(m,b,c)=>m+' · '+(soc?'play amount ':'bet ')+b+(c?' · cost '+c:''), modeName:{base:'Base game',bonus:'Bonus',super:'Super bonus'},
    session:'Session', net:'Net', loading:'Loading…', noSession:'This game must be opened from the casino.',
    music:'Music', musicOn:'Turn music on', musicOff:'Turn music off', soundOn:'Turn sound on', soundOff:'Turn sound off', rulesTip:'Game rules', spinAria:'Spin', stopAuto:n=>'Stop autoplay ('+n+')',
    autoAsk:n=>'Start autoplay for '+n+' spins?', autoStart:'Start autoplay', dec:'Decrease', inc:'Increase',
    err:{ ERR_IPB:'Insufficient balance.', ERR_IS:'Your session has expired. Please reload the game.', ERR_ATE:'Authentication failed. Please reload the game.', ERR_GLE: soc?'Play limit reached.':'Limit reached.', ERR_LOC:'This game is not available in your location.', ERR_MAINTENANCE:'The game is under maintenance. Please try again later.', def:'Connection problem. Please try again.' },
    controls:[['Spin button','Starts a spin. During autoplay it shows the spins left; tap it to stop.'],['− / +',(soc?'Lowers or raises the play amount.':'Lowers or raises the bet.')],['Auto','Choose a number of automatic spins, then confirm to start.'],['Turbo','Speeds up the animations.'],['Bonus',(soc?'Starts the bonus':'Buys the bonus')+' for 100× the '+(soc?'play amount':'bet')+'.'],['Super bonus',(soc?'Starts the super bonus':'Buys the super bonus')+' for 300× the '+(soc?'play amount':'bet')+'; every cell starts at x2.'],['♪','Turns the music on or off.'],['Speaker','Turns all sound on or off.'],['?','Opens these rules.'],['Space','Starts a spin (when allowed).']],
    rules:(f)=>`<h2>Rules</h2>
      <p>7 × 7 grid. A cluster of <b>5 or more matching symbols</b>, connected horizontally or vertically, awards a win according to its size. Values below are for your current ${soc?'play amount':'bet'} of <b>${f.bet}</b>; each extra symbol in a cluster wins more, up to 15+.</p>
      ${f.table}
      <h3>Tumbles</h3><p>Winning symbols explode, the symbols above fall down and new ones drop in. Tumbles continue as long as new clusters form.</p>
      <h3>Multiplier spots</h3><ul><li>When a winning symbol explodes on a cell, the cell becomes <b>x2</b>.</li><li>Each further explosion on that cell doubles it: x4, x8, x16… up to x${MAX_MULT}.</li><li>A cluster on multiplier cells adds their values together (x4 + x8 = ×12) and multiplies its win.</li><li>In the base game the cells reset every spin. During free spins they stay until the end of the bonus.</li></ul>
      ${f.ladder}
      <h3>Free spins</h3><p>${f.scatter} 3 Bonus symbols = 10 spins · 4 = 12 · 5 = 15 · 6 = 20 · 7+ = 30. During the bonus, 3 or more Bonus symbols award ${RETRIGGER} extra spins. A bonus always wins at least ${MIN_BONUS_X}× the ${soc?'play amount':'bet'}.</p>
      ${f.buy}
      <h3>Max win</h3><p>Wins are capped at <b>${MAX_WIN_X.toLocaleString('en-US')}× the ${soc?'play amount':'bet'}</b> (${f.maxwin}). When it is reached, the round ends and the max win is awarded.</p>
      <h3>Return to player</h3><p>The theoretical RTP is <b>${RTP_TEXT}</b> for the base game, the Bonus and the Super bonus.</p>
      <h3>Controls</h3><div class="ctrl-list">${f.controls}</div>
      <h3>Disclaimer</h3><p style="color:var(--mute);font-size:13px">A malfunction voids all wins and plays. A stable internet connection is required; if the connection is lost, reload the game to complete an unfinished round. The RTP is a theoretical value calculated over a very large number of rounds. All results are determined by the server; animations and displayed values are for illustration only. Spooky Burst™ © ${new Date().getFullYear()} KPOS. All rights reserved.</p>`,
    rulesBuy:(a,b)=>`<h3>Bonus and Super bonus</h3><p>Bonus: ${a} (100× the ${soc?'play amount':'bet'}). Super bonus, all cells start at x2: ${b} (300× the ${soc?'play amount':'bet'}).</p>`, close:'Close'
  };
  const fr = {
    balance:'Solde', bet: soc?'Montant':'Mise', buy:'Bonus', buyD:'10 free spins ou plus, multiplicateurs persistants.', sup:'Super bonus', supD:'10 free spins ou plus, toutes les cases démarrent à <b>x2</b>.',
    pay:'Valeur des symboles', paySub:'Selon la taille du groupe, pour', max:'Gain max :', speed:'Vitesse', note:'Taux de retour théorique '+RTP_TEXT.replace('.',',')+'.', fsWin:'Total du bonus', heat:'Multiplicateurs en jeu',
    hint:'Formez des groupes de 5 symboles identiques ou plus.', luck:'Bonne chance…', nowin:'Pas de groupe cette fois.', win:'Gain', nice:'JOLI GAIN !', big:'GROS GAIN !', huge:'ÉNORME !', bonusDone:'Bonus terminé !',
    left:n=>n+' restant'+(n>1?'s':''), trig:'Bonus déclenché', bought:'Bonus lancé', spins:n=>n+' FREE SPINS',
    intro:n=>n+' symboles Bonus. Pendant tout le bonus, les multiplicateurs <b>restent en place</b> et continuent de doubler.', introSup:'<b>Super bonus :</b> les 49 cases démarrent déjà à x2.', start:'Commencer',
    retrig:'Relance', over:'Bonus terminé', maxed:'Gain maximum atteint', inSpins:n=>'en '+n+' free spin'+(n>1?'s':''), cont:'Continuer',
    confirm:(b,sup)=>(soc?'Pour un montant de ':'Pour une mise de ')+b+', vous obtenez <b>10 free spins</b> ou plus'+(sup?', avec <b>toutes les cases à x2</b> dès le départ':'')+'.', cancel:'Annuler', buyBtn: soc?'Lancer':'Acheter',
    cascade:n=>'CASCADE ×'+n, skip:'Touchez pour passer', tapCont:'Touchez pour continuer', tiers:['BIG WIN','MEGA WIN','EPIC WIN','LÉGENDAIRE'], best:'(meilleur)', symbol:'Symbole',
    replayDone:'Rejeu terminé', replayAgain:'Revoir', replayPlay:'Lancer', replayWin:x=>'Gain : '+x, replayBanner:(m,b,c)=>m+' · '+(soc?'montant ':'mise ')+b+(c?' · coût '+c:''), modeName:{base:'Jeu de base',bonus:'Bonus',super:'Super bonus'},
    session:'Session', net:'Net', loading:'Chargement…', noSession:'Ce jeu doit être ouvert depuis le casino.',
    music:'Musique', musicOn:'Activer la musique', musicOff:'Couper la musique', soundOn:'Activer le son', soundOff:'Couper le son', rulesTip:'Règles du jeu', spinAria:'Lancer', stopAuto:n=>'Arrêter l’auto ('+n+')',
    autoAsk:n=>'Lancer '+n+' spins automatiques ?', autoStart:'Lancer l’auto', dec:'Diminuer', inc:'Augmenter',
    err:{ ERR_IPB:'Solde insuffisant.', ERR_IS:'Votre session a expiré. Rechargez le jeu.', ERR_ATE:'Échec de l’authentification. Rechargez le jeu.', ERR_GLE:'Limite atteinte.', ERR_LOC:'Ce jeu n’est pas disponible dans votre pays.', ERR_MAINTENANCE:'Le jeu est en maintenance. Réessayez plus tard.', def:'Problème de connexion. Réessayez.' },
    controls:[['Bouton de lancement','Lance un spin. En automatique, il affiche les spins restants ; touchez-le pour arrêter.'],['− / +',(soc?'Diminue ou augmente le montant.':'Diminue ou augmente la mise.')],['Auto','Choisissez un nombre de spins automatiques, puis confirmez pour lancer.'],['Turbo','Accélère les animations.'],['Bonus',(soc?'Lance le bonus':'Achète le bonus')+' pour 100 fois '+(soc?'le montant':'la mise')+'.'],['Super bonus',(soc?'Lance le super bonus':'Achète le super bonus')+' pour 300 fois '+(soc?'le montant':'la mise')+' ; toutes les cases démarrent à x2.'],['♪','Active ou coupe la musique.'],['Haut-parleur','Active ou coupe tous les sons.'],['?','Ouvre ces règles.'],['Espace','Lance un spin (si autorisé).']],
    rules:(f)=>`<h2>Règles</h2>
      <p>Grille de 7 × 7. Un groupe de <b>5 symboles identiques ou plus</b>, reliés horizontalement ou verticalement, rapporte un gain selon sa taille. Le tableau donne les valeurs pour ${soc?'votre montant actuel':'votre mise actuelle'} de <b>${f.bet}</b> : chaque symbole en plus rapporte davantage, jusqu'à 15 et plus.</p>
      ${f.table}
      <h3>Cascades</h3><p>Les symboles gagnants explosent, ceux du dessus tombent et de nouveaux arrivent. Tant qu'un groupe se forme, ça continue.</p>
      <h3>Cases multiplicatrices</h3><ul><li>Dès qu'un symbole gagnant explose sur une case, elle devient <b>x2</b>.</li><li>Chaque nouvelle explosion la double : x4, x8, x16… jusqu'à x${MAX_MULT}.</li><li>Un groupe posé sur des cases multiplicatrices additionne leurs valeurs (x4 + x8 = ×12) et multiplie son gain.</li><li>En jeu de base, la grille se vide à chaque spin. En free spins, les cases restent jusqu'à la fin du bonus.</li></ul>
      ${f.ladder}
      <h3>Free spins</h3><p>${f.scatter} 3 Bonus = 10 spins · 4 = 12 · 5 = 15 · 6 = 20 · 7+ = 30. Pendant le bonus, 3 Bonus ou plus ajoutent ${RETRIGGER} spins. Un bonus rapporte toujours au moins ${MIN_BONUS_X} fois ${soc?'le montant':'la mise'}.</p>
      ${f.buy}
      <h3>Gain maximum</h3><p>Les gains sont plafonnés à <b>${MAX_WIN_X.toLocaleString('fr-FR')} fois ${soc?'le montant':'la mise'}</b> (${f.maxwin}). Dès qu'il est atteint, la partie s'arrête et le gain maximum est accordé.</p>
      <h3>Taux de retour</h3><p>Le taux de retour théorique est de <b>${RTP_TEXT.replace('.',',')}</b> pour le jeu de base, le Bonus et le Super bonus.</p>
      <h3>Commandes</h3><div class="ctrl-list">${f.controls}</div>
      <h3>Avertissement</h3><p style="color:var(--mute);font-size:13px">Tout dysfonctionnement annule les parties et les gains. Une connexion internet stable est nécessaire ; en cas de coupure, rechargez le jeu pour terminer une partie en cours. Le taux de retour est une valeur théorique calculée sur un très grand nombre de parties. Tous les résultats sont déterminés par le serveur ; les animations et les valeurs affichées sont illustratives. Spooky Burst™ © ${new Date().getFullYear()} KPOS. Tous droits réservés.</p>`,
    rulesBuy:(a,b)=>`<h3>Bonus et Super bonus</h3><p>Bonus : ${a} (100 fois ${soc?'le montant':'la mise'}). Super bonus, toutes les cases à x2 : ${b} (300 fois ${soc?'le montant':'la mise'}).</p>`, close:'Fermer'
  };
  return LANG==='fr' ? fr : en;
}
let T = makeT(SOC), TIERS = [];
function setTexts(){ T = makeT(SOC); TIERS = [20,50,100,250].map((x,i)=>({x,label:T.tiers[i]})); }
setTexts();

''')

    # ---------------------------------------------------------------- serveur, partie, actions, règles
    region('const Backend = (() => {', '/* ============ BRANCHEMENTS ============ */', r'''const Backend = (() => {
  const sid = Q.get('sessionID'), rgs = Q.get('rgs_url');
  const live = !!(sid && rgs) && !REPLAY;
  const base = rgs ? (/^https?:\/\//.test(rgs) ? rgs : 'https://' + rgs).replace(/\/+$/, '') : '';
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
    live, hasRgs: !!rgs,
    async authenticate(){
      const d = await call('POST', '/wallet/authenticate', { sessionID: sid, language: LANG });
      round = d.round || null;
      return d;
    },
    pendingRound(){ return round && round.active && eventsOf(round).length ? { events: eventsOf(round), mode: round.mode, amount: round.amount } : null; },
    async play(mode, b){
      const d = await call('POST', '/wallet/play', { sessionID: sid, mode, amount: Math.round(b * 1e6), currency: CURRENCY });
      if(d.balance) setBalance(d.balance.amount / 1e6);
      round = d.round;
      const ev = eventsOf(d.round);
      if(!ev.length){ const er = new Error('empty round'); er.code = 'ERR_GEN'; throw er; }
      return ev;
    },
    async endRound(){
      if(round && round.active){ const d = await call('POST', '/wallet/end-round', { sessionID: sid }); if(d.balance) setBalance(d.balance.amount / 1e6); }
      round = null;
    },
    async balance(){ try{ const d = await call('POST', '/wallet/balance', { sessionID: sid }); if(d.balance && !busy) setBalance(d.balance.amount / 1e6); }catch(e){} },
    async replay(){
      const p = k => encodeURIComponent(Q.get(k) || '');
      const d = await call('GET', `/bet/replay/${p('game')}/${p('version')}/${p('mode')}/${p('event')}`);
      const rd = d.round || d;
      return { events: eventsOf(rd), cost: +(d.costMultiplier || rd.costMultiplier || 0) || null };
    }
  };
})();

/* erreurs : fenêtre normale, ou écran bloquant (session invalide, serveur injoignable au lancement) */
function errText(err){ const code = err && err.code; return { code, txt: (code && T.err[code]) || T.err.def }; }
function showError(err){
  const { code, txt } = errText(err); console.error(err);
  modal(`<h2 style="font-size:26px">${txt}</h2>${code && code!=='NET' ? `<p style="color:var(--mute);font-size:13px">${code}</p>` : ''}`, [[T.close,1]]);
}
function bootScreen(html){ let el = $('boot'); if(!el){ el = document.createElement('div'); el.id='boot'; el.className='boot'; document.body.appendChild(el); } el.innerHTML = '<div>'+html+'</div>'; el.hidden=false; }
function bootDone(){ const el=$('boot'); if(el) el.remove(); }
function fatal(err, txt){ const e = err ? errText(err) : { txt, code:null }; if(err) console.error(err); busy = true; updateUI(); bootScreen(`<h2>${e.txt}</h2>${e.code && e.code!=='NET' ? `<p style="opacity:.7;font-size:13px">${e.code}</p>` : ''}`); }

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
    catch(err){ busy=false; autoLeft=0; $('autoSel').value='0'; updateUI(); if(err.code==='ERR_IS'||err.code==='ERR_ATE') fatal(err); else showError(err); return false; }
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
let ready = false;                 // vrai après une authentification réussie
async function spin(){
  if(!ready||busy||inFS||REPLAY) return;
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
  if(!ready||busy||inFS||REPLAY||JUR.disabledBuyFeature) return;
  const b=bet(), mode=sup?'super':'bonus', price=b*CFG.MODES[mode].cost;
  const ok=await modal(`<div class="kicker">${sup?T.sup:T.buy}</div><h2>${fmt(price)}</h2><p>${T.confirm(fmt(b),sup)}</p>`, [[T.cancel,false,'ghost'],[T.buyBtn,true]]);
  if(!ok) return;
  if(balance<price){ showError({code:'ERR_IPB'}); return; }
  autoLeft=0; $('autoSel').value='0';
  await playRound(mode, b);
}

function showRules(){
  const b=bet();
  const head='<tr><th>'+T.symbol+'</th>'+[5,6,7,8,9,10,11,12,13,14,'15+'].map(n=>`<th>${n}</th>`).join('')+'</tr>';
  const rows=PAYTABLE.map((p,i)=>`<tr><td>${symSVG(i)} ${NAMES[i]}${i===0?' <b style="color:var(--gold)">'+T.best+'</b>':''}</td>${p.map(v=>`<td>${fmtPay(v*b)}</td>`).join('')}</tr>`).join('');
  const ladder='<div class="ladder">'+Object.entries(MULT_COLORS).map(([v,c])=>`<span style="background:${c}">x${v}</span>`).join('')+'</div>';
  const controls=T.controls.filter(([k])=> !(JUR.disabledBuyFeature && /onus/.test(k)) && !(JUR.disabledAutoplay && k==='Auto') && !(JUR.disabledTurbo && k==='Turbo') && !(JUR.disabledSpacebar && /Space|Espace/.test(k)))
    .map(([k,v])=>`<b>${k}</b><span>${v}</span>`).join('');
  modal(T.rules({ bet:fmt(b), table:`<div class="tablewrap"><table class="pay">${head}${rows}</table></div>`, ladder, controls,
    scatter:symSVG(7).replace('<svg','<svg style="width:28px;height:28px;vertical-align:middle"'),
    buy: JUR.disabledBuyFeature ? '' : T.rulesBuy(fmt(BUY_STD*b), fmt(BUY_SUP*b)), maxwin:fmt(MAX_WIN_X*b) }), [[T.close,1]], true);
}

''')

    # ---------------------------------------------------------------- branchements + démarrage
    region('/* ============ BRANCHEMENTS ============ */', '</script>', r'''/* ============ BRANCHEMENTS ============ */
$('spinBtn').onclick=()=>{ A(); if(autoLeft>0){ autoLeft=0; $('autoSel').value='0'; updateUI(); return; } SFX.click(); spin(); };
$('betDown').onclick=()=>{ if(betIdx>0 && !busy){ betIdx--; SFX.click(); updateUI(); } };
$('betUp').onclick=()=>{ if(betIdx<BETS.length-1 && !busy){ betIdx++; SFX.click(); updateUI(); } };
$('buyStd').onclick=()=>{ A(); buy(false); };
$('buySup').onclick=()=>{ A(); buy(true); };
$('turboBtn').onclick=e=>{ turbo=!turbo; e.currentTarget.setAttribute('aria-pressed',turbo); SFX.click(); };
/* [104] autoplay : confirmation avant de démarrer */
$('autoSel').onchange=async e=>{ A(); const n=+e.target.value; e.target.blur();
  if(n<=0){ autoLeft=0; updateUI(); return; }
  if(!ready||busy||inFS){ e.target.value='0'; return; }
  const ok = await modal(`<h2 style="font-size:26px">${T.autoAsk(n)}</h2>`, [[T.cancel,false,'ghost'],[T.autoStart,true]]);
  if(!ok){ e.target.value='0'; autoLeft=0; updateUI(); return; }
  autoLeft=n; updateUI(); spin(); };
$('rulesBtn').onclick=()=>{ SFX.click(); showRules(); };
function paintMute(){ $('muteIcon').innerHTML = muted ? '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>' : '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'; $('muteBtn').setAttribute('aria-label', muted?T.soundOn:T.soundOff); $('muteBtn').title = muted?T.soundOn:T.soundOff; }
$('muteBtn').onclick=()=>{ muted=!muted; try{ localStorage.setItem('cb-muted',muted?'1':'0'); }catch(e){} paintMute(); A(); SFX.click(); Music.play(); };
/* [228] barre espace : toujours un spin (hors fenêtres et listes), jamais un clic sur le bouton qui a le focus */
addEventListener('keydown',e=>{ if(e.code!=='Space' && e.key!==' ') return;
  if(JUR.disabledSpacebar || REPLAY || document.querySelector('.ov,.bigwin,.boot') || document.activeElement.tagName==='SELECT') return;
  e.preventDefault(); if(document.activeElement && document.activeElement.blur) document.activeElement.blur(); A(); if(!e.repeat) spin(); }, true);
addEventListener('pointerup',()=>{ const a=document.activeElement; if(a && a.tagName==='BUTTON') a.blur(); });
paintMute();
$('musicBtn').onclick=()=>{ A(); Music.toggle(); };
addEventListener('pointerdown',()=>{ A(); Music.kick(); },{once:true});
addEventListener('keydown',()=>{ A(); Music.kick(); },{once:true});

/* tableau de valeur des symboles (affiché dans les règles ; le panneau latéral est masqué) */
function buildValues(){
  const b=bet(), n = v => { const x=v*b, m=CURRENCY?(CUR_META[CURRENCY]||[0,2]):[0,2]; return sp(x.toLocaleString(LOCALE,{minimumFractionDigits:x<100?m[1]:0,maximumFractionDigits:x<100?Math.max(m[1],6):0})); };
  $('valList').innerHTML = PAYTABLE.map((p,i)=>`<div class="vrow${i===0?' top':''}" title="${NAMES[i]}${i===0?' '+T.best:''}"><span>${symSVG(i)}</span><span><b>${n(p[0])}</b></span><span>${n(p[1])}</span><span>${n(p[3])}</span><span>${n(p[5])}</span><span>${n(p[10])}</span></div>`).join('')
    + `<div class="vrow"><span>${symSVG(7)}</span><span class="sc">3+ = free spins</span></div>`;
  $('valBet').textContent=fmt(b);
  $('maxWin').textContent=fmt(MAX_WIN_X*b);
}

/* ============ DÉMARRAGE ============ */
function applyLang(){
  const set=(id,html)=>{ const el=$(id); if(el) el.innerHTML=html; };
  set('tBalance',T.balance); set('tBuy',T.buy); set('tBuyD',T.buyD); set('tSup',T.sup); set('tSupD',T.supD); set('tPay',T.pay); set('tPaySub',T.paySub);
  set('tMax',T.max); set('tNote', T.note); set('tFsWin',T.fsWin); set('tHeat',T.heat); set('tBet',T.bet); set('tSpeed',T.speed); if(!busy) set('msg',T.hint);
  const tip=(id,t)=>{ const el=$(id); if(el){ el.title=t; el.setAttribute('aria-label',t); } };
  tip('musicBtn',T.music); tip('rulesBtn',T.rulesTip); tip('betDown',T.dec); tip('betUp',T.inc); tip('spinBtn',T.spinAria);
  document.documentElement.lang = LANG; paintMute();
}
function applyJurisdiction(){
  if(JUR.disabledTurbo){ $('turboBtn').closest('.grp').hidden = true; turbo=false; }
  if(JUR.disabledAutoplay){ $('autoSel').closest('.grp').hidden = true; autoLeft=0; }
  if(JUR.disabledBuyFeature){ $('buyStd').hidden = true; $('buySup').hidden = true; }
}
function startGrid(){
  let ev; do { ev = ENG.playRound('base').events; } while(ev.length!==2);     // une grille sans gain ni Bonus (décor de départ uniquement)
  const g = boardOf(ev[0].board);
  grid=Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{ const el=makeSym(g[r][c],c); place(el,r); symsEl.appendChild(el); return {s:g[r][c],el}; }));
}
/* [242] niveaux de mise : uniquement ceux du serveur, bornés par minBet / maxBet / stepBet */
function betLevelsFrom(c){
  const min=+c.minBet||0, max=+c.maxBet||Infinity, step=+c.stepBet||0;
  const ok = v => v>=min && v<=max && (!step || v % step === 0);
  let lv = Array.isArray(c.betLevels) ? c.betLevels.filter(ok) : [];
  if(!lv.length && min && step && isFinite(max)){ lv=[]; for(let v=min; v<=max && lv.length<40; v+=step) lv.push(v); }
  return lv;
}
async function runReplay(){
  document.body.classList.add('replay');
  const amount = (+Q.get('amount') || 1e6) / 1e6, mode = String(Q.get('mode') || 'base').toLowerCase();
  BETS=[amount]; betIdx=0; CURRENCY = Q.get('currency') || null; $('balance').textContent='—';
  let data;
  try { data = await Backend.replay(); } catch(err){ fatal(err); return; }
  if(!data.events.length){ fatal({code:'ERR_GEN'}); return; }
  const cost = data.cost || (CFG.MODES[mode] ? CFG.MODES[mode].cost : 1);
  const banner=$('rpBanner'); banner.hidden=false;
  banner.textContent = T.replayBanner((T.modeName[mode]||mode).toUpperCase(), fmt(amount), cost!==1 ? fmt(amount*cost)+' ('+cost+'×)' : '');
  const machine=document.querySelector('.machine');
  const play = () => new Promise(res=>{ const o=document.createElement('div'); o.className='rp-play'; o.innerHTML=`<button type="button">▶ ${T.replayPlay}</button>`; machine.appendChild(o); o.querySelector('button').onclick=()=>{ A(); o.remove(); res(); }; });
  for(;;){
    await play();
    document.querySelectorAll('.rp-end').forEach(e=>e.remove());
    busy=true; resetSpots(); const won = await playBook(data.events, amount, mode); busy=false;
    const end=document.createElement('div'); end.className='rp-end';
    end.innerHTML=`<span>${T.replayDone} · ${T.replayWin(fmt(won*amount))}</span><button type="button">${T.replayAgain}</button>`;
    machine.appendChild(end);
    await new Promise(res=>{ end.querySelector('button').onclick=()=>{ end.remove(); res(); }; });
  }
}
(async function init(){
  applyLang(); startGrid(); renderAllSpots(); applyTheme(themeId);
  if(REPLAY){ if(!Backend.hasRgs){ fatal(null, T.noSession); return; } runReplay(); return; }
  if(!Backend.live){ fatal(null, T.noSession); return; }
  busy = true; updateUI(); bootScreen(`<div class="spinner"></div><div>${T.loading}</div>`);
  try {
    const d = await Backend.authenticate();
    CURRENCY = d.balance && d.balance.currency || null;
    const c = d.config || {};
    Object.assign(JUR, c.jurisdiction || {});
    if(JUR.socialCasino){ SOC = true; }
    setTexts();
    const levels = betLevelsFrom(c);
    if(!levels.length){ fatal({code:'ERR_VAL'}); return; }
    BETS = levels.map(v => v/1e6);
    const def = BETS.indexOf((c.defaultBetLevel||0)/1e6);
    betIdx = def>=0 ? def : Math.max(0, BETS.findIndex(v=>v>=1));
    applyJurisdiction(); applyLang();
    setBalance(d.balance ? d.balance.amount/1e6 : 0);
    setInterval(()=>Backend.balance(), 60000);
    ready = true; busy = false; bootDone(); updateUI();
    const pending = Backend.pendingRound();
    if(pending){
      const b = pending.amount ? pending.amount/1e6 : bet(); const i = BETS.indexOf(b); if(i>=0) betIdx=i;
      await playRound(String(pending.mode||'base').toLowerCase(), b, pending.events);
    }
  } catch(err){ fatal(err); return; }
  paintSession();
})();
''')
    # ---------------------------------------------------------------- [171] le replay avance tout seul dans les fenêtres à un seul bouton
    sub("    document.body.appendChild(ov); (row.querySelector('.go')||row.firstChild).focus({preventScroll:true});",
        "    document.body.appendChild(ov); (row.querySelector('.go')||row.firstChild).focus({preventScroll:true});\n"
        "    if(REPLAY && buttons.length===1) setTimeout(()=>{ if(ov.isConnected){ ov.remove(); res(buttons[0][1]); } }, 2500);")
    return s
