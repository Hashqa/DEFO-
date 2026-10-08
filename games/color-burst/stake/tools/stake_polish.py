"""
Refonte visuelle du front-end Stake (retours de la revue : barre de mise, animations, habillage).

Appliqué par build_frontend.py APRÈS stake_fixes.apply : remplace toute la structure de l'écran
(nouvelles classes « sb-* », donc l'ancienne mise en page ne s'applique plus), garde les mêmes
identifiants pour que la logique de jeu, le serveur et les contrôles de conformité restent inchangés.
"""
import re

DOM = r'''<div class="sb-amb" aria-hidden="true"><div class="fog f1"></div><div class="fog f2"></div><div class="bats"></div><div class="motes"></div></div>
<div class="sb" id="app">
  <div class="sb-col l">
    <div class="sb-logo"><h1 class="logo" aria-label="Spooky Burst"><span>S</span><span>P</span><span>O</span><span>O</span><span>K</span><span>Y</span><b>BURST</b></h1></div>
    <aside class="sb-buys">
      <button class="sb-buy std" id="buyStd"><img class="art" src="theme/halloween/symbols/0.png" alt="" draggable="false"><span class="txt"><span class="k" id="tBuy">Bonus</span><span class="d" id="tBuyD"></span></span><span class="p" id="priceStd"></span></button>
      <button class="sb-buy sup" id="buySup"><img class="art" src="theme/halloween/symbols/7.png" alt="" draggable="false"><span class="txt"><span class="k" id="tSup">Super bonus</span><span class="d" id="tSupD"></span></span><span class="p" id="priceSup"></span></button>
    </aside>
  </div>

  <section class="sb-stage">
    <div class="rp-banner" id="rpBanner" hidden></div>
    <div class="sb-frame" id="boardWrap">
      <div class="heat" id="heat" hidden><span id="tHeat">Multipliers in play</span> <b id="heatVal">×0</b></div>
      <div class="sb-board" id="board">
        <div class="layer antic" id="antic"></div>
        <div class="layer spots" id="spots"></div>
        <div class="layer syms" id="syms"></div>
        <svg class="layer sb-lines" id="winLines" viewBox="-0.1 -0.1 7.2 7.2" preserveAspectRatio="none" aria-hidden="true"></svg>
        <div class="layer badges" id="badges"></div>
        <div class="layer floats" id="floats"></div>
        <div class="combo" id="combo"></div>
      </div>
    </div>
    <div class="sb-msg"><span class="msg" id="msg"></span></div>
  </section>

  <div class="sb-col r">
    <div class="sb-icons">
      <button class="sb-icon" id="musicBtn" aria-label="Music" title="Music" hidden><svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg></button>
      <button class="sb-icon" id="muteBtn" aria-label="Sound" title="Sound"><svg viewBox="0 0 24 24" id="muteIcon"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg></button>
      <button class="sb-icon" id="rulesBtn" aria-label="Game rules" title="Game rules"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/></svg></button>
    </div>
    <aside class="sb-info">
      <div class="sb-fs" id="fsBanner" hidden>
        <div class="lab">Free spins</div><div class="val" id="fsLeft"></div>
        <div class="lab" id="tFsWin">Bonus total</div><div class="val gold" id="fsTotal"></div>
      </div>
      <div class="sb-ladder" id="ladder"><div class="lab" id="tLadder">Multipliers</div><div class="chips"></div></div>
    </aside>
    <p class="sb-sess" id="sess" hidden></p>
  </div>

  <footer class="sb-bar">
    <div class="sb-left">
      <div class="sb-cell"><small id="tBalance">Balance</small><strong id="balance">—</strong><button class="reload" id="reload" hidden></button></div>
      <div class="sb-cell win"><small id="tWinLbl">Win</small><strong class="amt" id="winAmt"></strong></div>
    </div>
    <div class="sb-center">
      <button class="sb-round" id="betDown" aria-label="Decrease"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>
      <button class="sb-spin" id="spinBtn" aria-label="Spin"><svg viewBox="0 0 24 24" id="spinIcon"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg></button>
      <button class="sb-round" id="betUp" aria-label="Increase"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button>
    </div>
    <div class="sb-right">
      <div class="sb-cell bet" id="betCell" role="button" tabindex="0" aria-haspopup="dialog"><small><span id="tBet">Bet</span> <i class="caret">▾</i></small><output id="bet"></output></div>
      <div class="grp sb-opt"><button class="sb-icon" id="autoBtn" aria-label="Autoplay" title="Autoplay" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5"/><path d="M20 3.5v5h-5"/><path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5"/><path d="M4 20.5v-5h5"/></svg></button><select id="autoSel" aria-label="Autoplay" tabindex="-1"><option value="0">Auto off</option><option value="10">Auto 10</option><option value="25">Auto 25</option><option value="50">Auto 50</option><option value="100">Auto 100</option></select></div>
      <div class="grp sb-opt"><button class="sb-icon" id="turboBtn" aria-pressed="false" aria-label="Turbo" title="Turbo"><svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></button></div>
    </div>
  </footer>

  <div class="sb-autopanel sb-betpanel" id="betPanel" role="dialog" hidden><div class="lab" id="tBetLbl">Bet</div><div class="chips"></div></div>
  <div class="sb-autopanel" id="autoPanel" role="dialog" hidden><div class="lab" id="tAutoLbl">Autoplay</div><div class="chips"><button type="button" data-n="10">10</button><button type="button" data-n="25">25</button><button type="button" data-n="50">50</button><button type="button" data-n="100">100</button></div></div>

  <section class="values" aria-hidden="true" hidden>
    <h2 id="tPay"></h2><p class="vsub"><span id="tPaySub"></span> <b id="valBet"></b></p><div id="valList"></div>
    <p class="note"><span id="tMax"></span> <span id="maxWin"></span><br><span id="tNote"></span></p>
  </section>
</div>
'''

CSS = r'''
/* ====================== Refonte visuelle « sb » ====================== */
.sb{--pad:clamp(4px,1.1vmin,14px);--barH:clamp(46px,12.5vh,96px);--sideW:clamp(84px,19vw,300px);--msgH:clamp(14px,3.6vh,30px);
  --board:min(calc(100vh - var(--barH) - var(--msgH) - var(--pad)*5), calc(100vw - var(--sideW)*2 - var(--pad)*5));
  position:fixed;inset:0;box-sizing:border-box;padding:var(--pad) calc(var(--pad)*1.5);gap:var(--pad);
  display:grid;grid-template-columns:var(--sideW) minmax(0,1fr) var(--sideW);grid-template-rows:minmax(0,1fr) var(--barH);
  grid-template-areas:"l stage r" "bar bar bar";font-family:var(--body);color:#fff}
.sb button{font-family:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.sb svg{overflow:visible}
.sb-col{min-width:0;min-height:0;display:flex;flex-direction:column;gap:var(--pad)}
.sb-col.l{grid-area:l}
.sb-col.r{grid-area:r}

/* ---- logo ---- */
.sb-logo{flex:0 0 auto;display:flex;justify-content:center}
.sb .logo,.sb-splash .logo{margin:0;font-family:var(--display);font-weight:400;font-size:min(calc(var(--sideW)*.2), 7vh)!important;line-height:.86;text-align:center;letter-spacing:.01em;white-space:nowrap;
  filter:drop-shadow(0 .06em 0 #22062e) drop-shadow(.035em 0 0 #22062e) drop-shadow(-.035em 0 0 #22062e) drop-shadow(0 -.035em 0 #22062e) drop-shadow(0 0 .25em rgba(255,110,20,.55))}
.sb .logo span,.sb-splash .logo span{display:inline-block;color:transparent!important;background:linear-gradient(180deg,#fff2b8 0%,#ffbe2e 42%,#f05a0a 100%);-webkit-background-clip:text;background-clip:text;transform:rotate(-5deg) translateY(.03em)}
.sb .logo span:nth-child(even),.sb-splash .logo span:nth-child(even){transform:rotate(4deg) translateY(-.02em)}
.sb .logo b,.sb-splash .logo b{display:block;margin:.02em 0 0!important;font-weight:400;font-size:1.06em;letter-spacing:.06em;color:transparent!important;background:linear-gradient(180deg,#f2ffc8 0%,#7dff6a 45%,#0f9a35 100%);-webkit-background-clip:text;background-clip:text}

/* ---- cartes d'achat ---- */
.sb-buys{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:calc(var(--pad)*1.4)}
.sb-buy{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;column-gap:calc(var(--sideW)*.04);width:100%;box-sizing:border-box;text-align:left;cursor:pointer;
  padding:calc(var(--sideW)*.035) calc(var(--sideW)*.04);border-radius:calc(var(--sideW)*.07);border:2px solid;color:#fff;overflow:hidden;isolation:isolate;
  transition:transform .15s,filter .15s,box-shadow .2s}
.sb-buy.std{background:linear-gradient(155deg,#6a24a8 0%,#36105e 55%,#1d0738 100%);border-color:#b07cff;box-shadow:0 0 calc(var(--sideW)*.08) rgba(160,100,255,.38),inset 0 1px 0 rgba(255,255,255,.28),0 5px 0 rgba(0,0,0,.4)}
.sb-buy.sup{background:linear-gradient(155deg,#b0281e 0%,#5e0b12 55%,#2c040a 100%);border-color:#ff7a45;box-shadow:0 0 calc(var(--sideW)*.08) rgba(255,100,50,.4),inset 0 1px 0 rgba(255,255,255,.28),0 5px 0 rgba(0,0,0,.4)}
.sb-buy::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);transform:translateX(-120%);animation:sbShine 4.5s ease-in-out infinite}
.sb-buy.sup::after{animation-delay:2.2s}
@keyframes sbShine{0%,60%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
.sb-buy:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1)}
.sb-buy:active:not(:disabled){transform:translateY(2px)}
.sb-buy:disabled{filter:grayscale(.75) brightness(.6);cursor:not-allowed}
.sb-buy.short{filter:saturate(.4) brightness(.75)}
.sb-buy .art{width:calc(var(--sideW)*.26);height:calc(var(--sideW)*.26);object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));animation:sbFloat 3s ease-in-out infinite}
.sb-buy.sup .art{animation-delay:-1.5s}
@keyframes sbFloat{50%{transform:translateY(-6%) rotate(-3deg)}}
.sb-buy .txt{display:flex;flex-direction:column;min-width:0}
.sb-buy .k{font-family:var(--display);font-size:calc(var(--sideW)*.085);line-height:1;text-shadow:0 2px 0 rgba(0,0,0,.45)}
.sb-buy .d{font-size:calc(var(--sideW)*.045);line-height:1.25;opacity:.88;margin-top:.3em}
.sb-buy .p{grid-column:1 / -1;margin-top:calc(var(--sideW)*.03);text-align:center;font-weight:800;font-size:calc(var(--sideW)*.06);font-variant-numeric:tabular-nums;color:#2a1400;
  background:linear-gradient(180deg,#ffe486,#f0a01e);border-radius:999px;padding:.25em .6em;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 2px 0 rgba(0,0,0,.35)}

/* ---- scène et cadre de la grille ---- */
.sb-stage{grid-area:stage;position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.sb-frame{position:relative;width:var(--board);height:var(--board);box-sizing:border-box;margin-top:calc(var(--pad)*.5);padding:calc(var(--board)*.024);border-radius:calc(var(--board)*.05);
  background:linear-gradient(150deg,#5c4888 0%,#21143e 30%,#140a28 55%,#2e1f52 80%,#120a22 100%);
  box-shadow:0 0 0 calc(var(--board)*.004 + 1px) #07040f,0 0 0 calc(var(--board)*.011 + 1px) #7a5cc4,0 0 0 calc(var(--board)*.015 + 2px) #1a0f30,0 0 calc(var(--board)*.08) rgba(150,90,255,.45),0 calc(var(--board)*.03) calc(var(--board)*.08) rgba(0,0,0,.65),inset 0 2px 0 rgba(255,255,255,.22),inset 0 -3px 0 rgba(0,0,0,.55);
  transition:box-shadow .8s}
.sb-frame::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:7;
  background:radial-gradient(circle at calc(var(--board)*.024) calc(var(--board)*.024),#ffe6a0 0 calc(var(--board)*.006),#a8661a calc(var(--board)*.009),transparent calc(var(--board)*.012)),
    radial-gradient(circle at calc(100% - var(--board)*.024) calc(var(--board)*.024),#ffe6a0 0 calc(var(--board)*.006),#a8661a calc(var(--board)*.009),transparent calc(var(--board)*.012)),
    radial-gradient(circle at calc(var(--board)*.024) calc(100% - var(--board)*.024),#ffe6a0 0 calc(var(--board)*.006),#a8661a calc(var(--board)*.009),transparent calc(var(--board)*.012)),
    radial-gradient(circle at calc(100% - var(--board)*.024) calc(100% - var(--board)*.024),#ffe6a0 0 calc(var(--board)*.006),#a8661a calc(var(--board)*.009),transparent calc(var(--board)*.012))}
body.fs .sb-frame{background:linear-gradient(150deg,#a0402a 0%,#3e0c14 30%,#22060c 55%,#5a1a18 80%,#1a0408 100%);
  box-shadow:0 0 0 calc(var(--board)*.004 + 1px) #07040f,0 0 0 calc(var(--board)*.011 + 1px) #ff7a3a,0 0 0 calc(var(--board)*.015 + 2px) #2a0608,0 0 calc(var(--board)*.1) rgba(255,90,40,.6),0 calc(var(--board)*.03) calc(var(--board)*.08) rgba(0,0,0,.65),inset 0 2px 0 rgba(255,255,255,.22),inset 0 -3px 0 rgba(0,0,0,.55)}
.sb-board{position:relative;width:100%;height:100%;border-radius:calc(var(--board)*.032);overflow:hidden;
  background:radial-gradient(ellipse at 50% 25%,rgba(64,34,110,.82),rgba(16,7,30,.94) 75%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07),inset 0 calc(var(--board)*.02) calc(var(--board)*.05) rgba(0,0,0,.55)}
body.fs .sb-board{background:radial-gradient(ellipse at 50% 25%,rgba(110,30,40,.8),rgba(26,6,12,.94) 75%)}
.sb-frame.tense{animation:tense .3s ease-in-out infinite alternate}
.sb-frame.flash .sb-board{animation:boardFlash .3s ease-out}
.sb-frame.bshake{animation:bshake .35s ease-in-out}

/* cases */
.sb .spot{margin:4.5%;border-radius:20%;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.09),inset 0 -2px 5px rgba(0,0,0,.4);transition:background .25s,box-shadow .25s}
.sb .spot.marked{background:rgba(255,255,255,.12)}
.sb .spot.m{background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--t) 55%,transparent),color-mix(in srgb,var(--t) 18%,transparent) 75%);box-shadow:inset 0 0 0 2px var(--t),0 0 calc(var(--board)*.02) color-mix(in srgb,var(--t) 75%,transparent)}
.sb .spot.hit{background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--g) 60%,transparent),transparent 80%);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--g) 85%,#fff),0 0 calc(var(--board)*.03) var(--g)}
.sb .spot.m.hit{box-shadow:inset 0 0 0 3px #fff,0 0 calc(var(--board)*.04) var(--t)}
.sb .badge{font-size:calc(var(--board)*.025);right:3%;bottom:3%;padding:.04em .42em;background:linear-gradient(180deg,color-mix(in srgb,var(--t) 45%,#fff),var(--t) 60%);color:#1a0a24;border:1px solid rgba(0,0,0,.55);text-shadow:0 1px 0 rgba(255,255,255,.4)}
.sb .badge.t1024{background:linear-gradient(135deg,#fff6cf,#ffc83d 50%,#e07a00);animation:sbHot .6s ease-in-out infinite alternate}
@keyframes sbHot{to{box-shadow:0 0 calc(var(--board)*.03) #ffc83d,0 2px 0 rgba(0,0,0,.4)}}
.sb .badge.bump{animation:sbBadge .5s cubic-bezier(.3,1.8,.5,1)}
@keyframes sbBadge{0%{transform:scale(.2) rotate(-20deg)}55%{transform:scale(1.7) rotate(6deg)}100%{transform:scale(1)}}

/* symboles */
.sb .sym .symimg{width:84%;height:84%;filter:drop-shadow(0 calc(var(--board)*.006) calc(var(--board)*.004) rgba(0,0,0,.5))}
.sb .sym .in>.symimg:not(.winimg){animation:sbIdle 4.2s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes sbIdle{50%{transform:translateY(-3%) scale(1.025)}}
.sb .sym .winimg{width:118%;height:118%;filter:none}
.sb .syms.dimming .sym:not(.win) .in{opacity:.32;filter:saturate(.5)}
.sb .sym.pop .in{transition:none;animation:sbPop .19s ease-in forwards}
@keyframes sbPop{0%{transform:scale(1);filter:brightness(1)}45%{transform:scale(1.32);filter:brightness(2.4)}100%{transform:scale(0) rotate(25deg);opacity:0;filter:brightness(3)}}
.sb .sym.schit .in{animation:schit .45s ease-in-out infinite alternate}
.sb .sym.schit .symimg{filter:drop-shadow(0 0 calc(var(--board)*.025) #ff3a2a) drop-shadow(0 0 calc(var(--board)*.01) #fff)}

/* contour lumineux des groupes gagnants */
.sb-lines{z-index:3;pointer-events:none;width:100%;height:100%}
.sb-lines .wl{fill:none;stroke:var(--g);stroke-width:4px;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px var(--g)) drop-shadow(0 0 7px var(--g));animation:sbLineIn .35s ease-out,sbLineGlow .6s .35s ease-in-out infinite alternate}
.sb-lines .wl2{fill:none;stroke:#fff;stroke-width:1.4px;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.9;animation:sbLineIn .35s ease-out}
@keyframes sbLineIn{from{opacity:0}}
@keyframes sbLineGlow{to{stroke-width:5.5px}}
.sb .badges{z-index:4}

/* gains flottants */
.sb .float .a{font-size:calc(var(--board)*.06)}
.sb .float .calc{font-size:calc(var(--board)*.036)}
.sb .float{text-shadow:0 3px 0 rgba(0,0,0,.65),0 0 10px rgba(0,0,0,.7),0 0 22px rgba(255,170,40,.45)}
.sb .combo{font-size:calc(var(--board)*.075);top:6%;background:linear-gradient(180deg,#fff6c8,#ffc23d 55%,#ff7a00);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 3px 0 #4a1600) drop-shadow(0 0 12px rgba(255,160,40,.7))}

/* jauge des multiplicateurs (au-dessus du cadre) */
.sb .heat{top:calc(var(--board)*-.02);font-size:calc(var(--board)*.024);padding:.25em 1em;background:linear-gradient(180deg,#2c1a52,#140a28);border:1px solid #7a5cc4;z-index:9}
.sb .heat b{font-size:1.4em}

/* message sous la grille */
.sb-msg{height:var(--msgH);display:flex;align-items:center;justify-content:center;min-width:0;max-width:100%}
.sb .msg{font-size:calc(var(--msgH)*.6);color:#d6cbf5;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb .msg.hype{font-family:var(--display);font-size:calc(var(--msgH)*.8);color:transparent;background:linear-gradient(180deg,#fff6c8,#ffc23d 55%,#ff7a00);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 2px 0 #4a1600)}

/* ---- colonne de droite ---- */
.sb-icons{flex:0 0 auto;display:flex;justify-content:flex-end;gap:calc(var(--pad)*.8)}
.sb-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:var(--pad)}
.sb-fs{text-align:center;border-radius:calc(var(--sideW)*.07);padding:calc(var(--sideW)*.05);background:linear-gradient(180deg,rgba(120,26,30,.92),rgba(34,6,14,.94));border:2px solid #ff7a45;box-shadow:0 0 calc(var(--sideW)*.1) rgba(255,90,40,.5),inset 0 1px 0 rgba(255,255,255,.25)}
.sb-fs .lab{font-size:calc(var(--sideW)*.05);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ffcfa6}
.sb-fs .val{font-family:var(--display);font-size:calc(var(--sideW)*.15);line-height:1.05;margin-bottom:.15em;font-variant-numeric:tabular-nums;text-shadow:0 3px 0 rgba(0,0,0,.45)}
.sb-fs .val.gold{font-size:calc(var(--sideW)*.1);color:var(--gold);margin-bottom:0}
.sb-ladder{text-align:center;border-radius:calc(var(--sideW)*.07);padding:calc(var(--sideW)*.045);background:linear-gradient(180deg,rgba(40,22,74,.85),rgba(14,6,28,.9));border:1px solid rgba(170,130,255,.35)}
.sb-ladder .lab{font-size:calc(var(--sideW)*.048);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c9b8ff;margin-bottom:.4em}
.sb-ladder .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:calc(var(--sideW)*.02)}
.sb-ladder .chips span{font-family:var(--display);font-size:calc(var(--sideW)*.06);padding:.08em .5em;border-radius:999px;color:#1a0a24;background:linear-gradient(180deg,color-mix(in srgb,var(--t) 45%,#fff),var(--t) 65%);box-shadow:0 2px 0 rgba(0,0,0,.4)}
body.fs .sb-ladder{display:none}
.sb-sess{margin:0;text-align:right;font-size:calc(var(--barH)*.16);color:#c9b8ff}

/* ---- barre de mise ---- */
.sb-bar{grid-area:bar;position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:calc(var(--pad)*1.5);padding:0 calc(var(--pad)*2.2);
  border-radius:calc(var(--barH)*.32);background:linear-gradient(180deg,rgba(46,26,82,.94),rgba(16,8,30,.97));border:1px solid rgba(180,140,255,.3);
  box-shadow:0 -4px 24px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.4)}
.sb-left,.sb-right{display:flex;align-items:center;gap:calc(var(--pad)*2.2);min-width:0}
.sb-right{justify-content:flex-end}
.sb-cell{display:flex;flex-direction:column;justify-content:center;line-height:1.08;min-width:0}
.sb-cell small{font-size:max(8px,calc(var(--barH)*.15));font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#b4a3e6}
.sb-cell strong,.sb-cell output{font-size:max(11px,calc(var(--barH)*.26));font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap;color:#fff}
.sb-cell.win strong{color:var(--gold);text-shadow:0 0 12px rgba(255,200,61,.35)}
.sb-cell.bet{align-items:flex-end}
.sb-center{display:flex;align-items:center;gap:calc(var(--barH)*.16)}
.sb-round{width:calc(var(--barH)*.5);height:calc(var(--barH)*.5);border-radius:50%;padding:0;display:grid;place-items:center;cursor:pointer;border:2px solid rgba(255,255,255,.2);
  background:linear-gradient(180deg,#4a3380,#1d1038);box-shadow:0 3px 0 rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.25);transition:transform .1s,filter .15s}
.sb-round svg{width:52%;height:52%;fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round}
.sb-round:active:not(:disabled){transform:translateY(2px)}
.sb-round:disabled{opacity:.35;cursor:not-allowed}
.sb-spin{position:relative;width:calc(var(--barH)*.9);height:calc(var(--barH)*.9);border-radius:50%;padding:0;display:grid;place-items:center;cursor:pointer;border:3px solid #ffdc8a;
  background:radial-gradient(circle at 36% 28%,#fff0b0 0%,#ffa22a 35%,#e05a00 70%,#8a2600 100%);
  box-shadow:0 5px 0 #5a1a00,0 0 0 4px rgba(255,150,40,.22),0 0 calc(var(--barH)*.35) rgba(255,130,30,.55),inset 0 -6px 12px rgba(120,30,0,.55),inset 0 4px 8px rgba(255,255,255,.45);transition:transform .1s,filter .2s}
.sb-spin svg{width:50%;height:50%;fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 2px 0 rgba(90,26,0,.7))}
.sb-spin:not(:disabled):not(.busy):not(.auto){animation:sbIdlePulse 2s ease-in-out infinite}
@keyframes sbIdlePulse{50%{box-shadow:0 5px 0 #5a1a00,0 0 0 8px rgba(255,150,40,.18),0 0 calc(var(--barH)*.55) rgba(255,130,30,.75),inset 0 -6px 12px rgba(120,30,0,.55),inset 0 4px 8px rgba(255,255,255,.45)}}
.sb-spin:active:not(:disabled){transform:translateY(3px) scale(.97)}
.sb-spin.busy svg{animation:sbRot .6s linear infinite}
@keyframes sbRot{to{transform:rotate(360deg)}}
.sb-spin.auto{border-color:#d8c4ff;background:radial-gradient(circle at 36% 28%,#f0e4ff 0%,#a774ff 35%,#5b22c4 70%,#26085e 100%);box-shadow:0 5px 0 #1e0650,0 0 0 4px rgba(170,120,255,.25),0 0 calc(var(--barH)*.4) rgba(150,90,255,.6)}
.sb-spin .cnt{font-family:var(--display);font-size:calc(var(--barH)*.32);text-shadow:0 2px 0 rgba(0,0,0,.45)}
.sb-spin:disabled{filter:grayscale(.65) brightness(.7);cursor:not-allowed}
.sb-icon{position:relative;width:calc(var(--barH)*.46);height:calc(var(--barH)*.46);border-radius:50%;padding:0;display:grid;place-items:center;cursor:pointer;border:1.5px solid rgba(255,255,255,.2);
  background:linear-gradient(180deg,rgba(60,38,104,.92),rgba(22,12,42,.95));box-shadow:0 2px 0 rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.18);transition:filter .15s,transform .1s}
.sb-icon svg{width:54%;height:54%;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.sb-icon:hover:not(:disabled){filter:brightness(1.2)}
.sb-icon:active:not(:disabled){transform:translateY(1px)}
.sb-icon:disabled{opacity:.4;cursor:not-allowed}
#turboBtn[aria-pressed="true"],#autoBtn.on{background:linear-gradient(180deg,#ffe486,#f09a1a);color:#2a1400;border-color:#fff0b0;box-shadow:0 0 14px rgba(255,190,60,.6),0 2px 0 rgba(0,0,0,.45)}
#turboBtn[aria-pressed="true"] svg{fill:#2a1400}
#musicBtn.off{opacity:.45}
.sb-opt{display:flex;align-items:center}
#autoSel{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.sb-autopanel{position:fixed;z-index:45;min-width:150px;background:linear-gradient(180deg,#2e1a56,#140a28);border:1px solid #8a6ad8;border-radius:16px;padding:10px 12px;box-shadow:0 14px 40px rgba(0,0,0,.6);animation:fadeIn .15s}
.sb-autopanel .lab{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c9b8ff;margin-bottom:8px;text-align:center}
.sb-autopanel .chips{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.sb-autopanel button{border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:8px 6px;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(180deg,#4a3380,#1d1038)}
.sb-autopanel button:hover{background:linear-gradient(180deg,#ffe486,#f09a1a);color:#2a1400}

/* ---- transitions et célébrations ---- */
.sb-flash{position:fixed;inset:0;z-index:55;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(255,220,160,.95),rgba(255,60,30,.7) 40%,rgba(40,0,10,0) 75%);animation:sbFlash .9s ease-out forwards}
@keyframes sbFlash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
.ov:has(.orbs){background:radial-gradient(circle at 50% 45%,rgba(120,10,20,.6),rgba(6,2,10,.9) 70%)}
.ov:has(.orbs)::before{content:"";position:absolute;left:50%;top:50%;width:160vmax;height:160vmax;margin:-80vmax 0 0 -80vmax;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(255,90,50,.16) 0deg 8deg,transparent 8deg 18deg);animation:sbRays 16s linear infinite;-webkit-mask:radial-gradient(circle,#000 10%,transparent 60%);mask:radial-gradient(circle,#000 10%,transparent 60%)}
.ov:has(.orbs) .card{background:linear-gradient(180deg,#4a0c1c,#16040c)!important;border:2px solid #ff7a45!important;box-shadow:0 0 70px rgba(255,80,40,.55),0 30px 80px rgba(0,0,0,.7)}
.ov:has(.orbs) .card h2{background:linear-gradient(180deg,#fff4c4,#ffc23d 50%,#ff6a00);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 #4a0c00);animation:sbTitle .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes sbTitle{0%{transform:scale(.3);opacity:0}100%{transform:scale(1)}}
.ov:has(.orbs) .orbs .symimg{width:clamp(40px,9vmin,64px);height:clamp(40px,9vmin,64px);animation:sbOrb 1.2s ease-in-out infinite alternate}
@keyframes sbOrb{to{transform:scale(1.15);filter:drop-shadow(0 0 12px #ff3a2a)}}
@keyframes sbRays{to{transform:rotate(360deg)}}
.bigwin{overflow:hidden}
.bigwin::before{content:"";position:absolute;left:50%;top:45%;width:170vmax;height:170vmax;margin:-85vmax 0 0 -85vmax;z-index:-1;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(255,200,80,.2) 0deg 7deg,transparent 7deg 15deg);animation:sbRays 14s linear infinite;-webkit-mask:radial-gradient(circle,#000 8%,transparent 55%);mask:radial-gradient(circle,#000 8%,transparent 55%)}
.bigwin .amt{color:#fff;text-shadow:0 4px 0 rgba(60,20,0,.85),0 0 24px rgba(255,190,60,.55)}
.card{background:linear-gradient(180deg,#2c1a5c,#130a2c)!important;border:1px solid #7a5cc4!important}
.btn.go{background:linear-gradient(180deg,#ffe486,#f09a1a)!important;box-shadow:0 4px 0 #8a4a00,inset 0 1px 0 rgba(255,255,255,.6)!important}

/* ---- replay ---- */
body.replay .sb-bar,body.replay .sb-buys{display:none!important}
body.replay .sb{grid-template-rows:minmax(0,1fr) 0;--board:min(calc(100vh - var(--msgH) - var(--pad)*6 - 26px), calc(100vw - var(--sideW)*2 - var(--pad)*5))}
.sb-stage .rp-banner{top:0}
.sb-stage .rp-end{bottom:calc(var(--msgH) + var(--pad))}

/* ---- petites hauteurs (popout) ---- */
@media (max-height:420px){ .sb-buy .d{display:none} .sb-ladder .lab{display:none} }
@media (max-height:300px){ .sb{--msgH:12px} .sb-ladder{display:none} .sb .heat{display:none!important} .sb-cell small{letter-spacing:.06em} .sb-buy .art{width:calc(var(--sideW)*.2);height:calc(var(--sideW)*.2)} }

/* ---- portrait (téléphone) ---- */
@media (max-aspect-ratio: 9/10){
  .sb{--barH:clamp(64px,10.5vh,104px);--topH:clamp(40px,7.5vh,72px);--buysH:clamp(50px,8.5vh,84px);--sideW:clamp(150px,42vw,260px);
    --board:min(calc(100vw - var(--pad)*3), calc(100vh - var(--barH) - var(--topH) - var(--buysH) - var(--msgH) - var(--pad)*8));
    grid-template-columns:minmax(0,1fr) auto;grid-template-rows:var(--topH) minmax(0,1fr) var(--buysH) var(--barH);
    grid-template-areas:"logo icons" "stage stage" "buys buys" "bar bar"}
  .sb-col{display:contents}
  .sb-logo{grid-area:logo;justify-content:flex-start;align-items:center}
  .sb .logo{font-size:min(calc(var(--topH)*.5),7.4vw)!important;display:block}
  .sb .logo b{display:inline-block;margin-left:.22em!important;font-size:1em}
  .sb-icons{grid-area:icons;align-items:center}
  .sb-icon{width:clamp(34px,9vw,46px);height:clamp(34px,9vw,46px)}
  .sb-buys,.sb-info{grid-area:buys;flex-direction:row;align-items:stretch;justify-content:stretch;gap:var(--pad)}
  .sb-buy{flex:1 1 0;min-width:0;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;grid-template-areas:"art k" "art p";column-gap:8px;row-gap:3px;padding:4px 10px;border-radius:14px}
  .sb-buy .art{grid-area:art;width:calc(var(--buysH)*.66);height:calc(var(--buysH)*.66)}
  .sb-buy .txt{grid-area:k}
  .sb-buy .k{font-size:min(calc(var(--buysH)*.26),4.6vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sb-buy .d{display:none}
  .sb-buy .p{grid-area:p;grid-column:auto;margin:0;justify-self:start;font-size:min(calc(var(--buysH)*.2),3.6vw);padding:.15em .7em}
  .sb-ladder{display:none}
  .sb-info{pointer-events:none}
  .sb-fs{flex:1 1 auto;display:grid;grid-template-columns:auto auto auto auto;align-items:center;justify-content:space-around;padding:4px 12px;pointer-events:auto}
  .sb-fs .lab{font-size:calc(var(--buysH)*.17)} .sb-fs .val{font-size:calc(var(--buysH)*.36);margin:0} .sb-fs .val.gold{font-size:calc(var(--buysH)*.3)}
  body.fs .sb-buys{visibility:hidden}
  .sb-sess{position:fixed;left:var(--pad);top:calc(var(--topH) + var(--pad));font-size:11px}
  .sb-bar{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);padding:0 calc(var(--pad)*2);gap:var(--pad)}
  .sb-left{flex-direction:column;align-items:flex-start;gap:2px}
  .sb-right{display:grid;grid-template-columns:auto auto;justify-items:end;gap:4px 8px}
  .sb-right .sb-cell.bet{grid-column:1 / -1}
  .sb-cell small{font-size:max(8px,calc(var(--barH)*.12))} .sb-cell strong,.sb-cell output{font-size:max(12px,min(calc(var(--barH)*.19),4.4vw))}
  .sb-center{gap:calc(var(--barH)*.1)} .sb-round{width:calc(var(--barH)*.42);height:calc(var(--barH)*.42)} .sb-spin{width:calc(var(--barH)*.82);height:calc(var(--barH)*.82)}
  .sb-right .sb-icon{width:calc(var(--barH)*.36);height:calc(var(--barH)*.36)}
  body.replay .sb{grid-template-rows:var(--topH) minmax(0,1fr) 0 0;--board:min(calc(100vw - var(--pad)*3), calc(100vh - var(--topH) - var(--msgH) - var(--pad)*6 - 26px))}
}

/* ---- panneau des mises ---- */
.sb-cell.bet{cursor:pointer;border-radius:10px;padding:2px 6px;margin:-2px -6px;transition:background .15s}
.sb-cell.bet:hover{background:rgba(255,255,255,.07)}
.sb-cell.bet .caret{font-style:normal;color:var(--gold);font-size:1.1em}
.sb-betpanel .chips{grid-template-columns:repeat(4,1fr);max-height:min(52vh,320px);overflow:auto}
.sb-betpanel button.cur{background:linear-gradient(180deg,#ffe486,#f09a1a);color:#2a1400}
.sb-betpanel{min-width:min(300px,calc(100vw - 16px))}
.sb-betpanel button{font-variant-numeric:tabular-nums;font-size:13px;white-space:nowrap}

/* ---- décor animé ---- */
.sb-amb{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.sb-amb .fog{position:absolute;left:-30%;width:160%;height:45%;bottom:-8%;opacity:.55;filter:blur(18px);
  background:radial-gradient(ellipse 22% 45% at 15% 60%,rgba(190,170,255,.32),transparent 70%),radial-gradient(ellipse 25% 40% at 45% 70%,rgba(160,140,230,.28),transparent 70%),radial-gradient(ellipse 22% 45% at 78% 60%,rgba(190,170,255,.3),transparent 70%);
  animation:sbFog 38s ease-in-out infinite alternate}
.sb-amb .fog.f2{bottom:-14%;opacity:.4;animation-duration:52s;animation-direction:alternate-reverse}
@keyframes sbFog{to{transform:translateX(18%)}}
body.fs .sb-amb .fog{background:radial-gradient(ellipse 22% 45% at 15% 60%,rgba(255,140,80,.3),transparent 70%),radial-gradient(ellipse 25% 40% at 45% 70%,rgba(255,90,60,.25),transparent 70%),radial-gradient(ellipse 22% 45% at 78% 60%,rgba(255,140,80,.28),transparent 70%)}
.sb-amb .bat{position:absolute;width:var(--s);height:calc(var(--s)*.5);top:var(--y);left:-8%;opacity:.85;animation:sbBat var(--d) linear infinite;animation-delay:var(--w)}
.sb-amb .bat svg{width:100%;height:100%;fill:#12061c;animation:sbFlap .22s ease-in-out infinite alternate}
@keyframes sbBat{0%{transform:translate(0,0)}25%{transform:translate(30vw,-4vh)}50%{transform:translate(60vw,2vh)}75%{transform:translate(90vw,-3vh)}100%{transform:translate(118vw,1vh)}}
@keyframes sbFlap{to{transform:scaleY(.45)}}
.sb-amb .mote{position:absolute;bottom:-4%;left:var(--x);width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle,#fff6d0,rgba(255,200,90,.6) 40%,transparent 70%);opacity:0;animation:sbMote var(--d) linear infinite;animation-delay:var(--w)}
body.fs .sb-amb .mote{background:radial-gradient(circle,#fff0c0,rgba(255,110,40,.8) 40%,transparent 70%)}
@keyframes sbMote{0%{transform:translate(0,0);opacity:0}10%{opacity:.9}100%{transform:translate(var(--dx),-105vh);opacity:0}}

/* ---- animation de gain propre à chaque symbole ---- */
.sb .sym.win .symimg{filter:drop-shadow(0 0 calc(var(--board)*.018) var(--wc,#fff)) drop-shadow(0 0 calc(var(--board)*.006) #fff) brightness(1.12)}
.sb .sym.s0{--wc:#39ff6a}.sb .sym.s1{--wc:#ff9a1a}.sb .sym.s2{--wc:#ff3b3b}.sb .sym.s3{--wc:#e6deff}.sb .sym.s4{--wc:#b07cff}.sb .sym.s5{--wc:#ff5fb8}.sb .sym.s6{--wc:#ffd23f}.sb .sym.s7{--wc:#ff2a2a}
body .sb .sym.s0.win .in{animation:wCauldron .5s ease-in-out infinite}
@keyframes wCauldron{0%,100%{transform:rotate(0) scale(1.08)}25%{transform:rotate(-6deg) scale(1.14,1.02)}50%{transform:rotate(0) scale(1.02,1.16) translateY(-4%)}75%{transform:rotate(6deg) scale(1.14,1.02)}}
body .sb .sym.s1.win .in{animation:wPumpkin .42s ease-in-out infinite alternate}
@keyframes wPumpkin{from{transform:scale(1.04);filter:brightness(1)}to{transform:scale(1.18) rotate(-3deg);filter:brightness(1.45)}}
body .sb .sym.s2.win .in{animation:wSkull .36s ease-in-out infinite}
@keyframes wSkull{0%,100%{transform:rotate(0) scale(1.08)}30%{transform:rotate(-10deg) scale(1.14) translateY(-3%)}60%{transform:rotate(9deg) scale(1.12)}}
body .sb .sym.s3.win .in{animation:wGhost .7s ease-in-out infinite alternate}
@keyframes wGhost{from{transform:translateY(4%) rotate(-5deg) scale(1.06);opacity:1}to{transform:translateY(-12%) rotate(6deg) scale(1.16);opacity:.85}}
body .sb .sym.s4.win .in{animation:wBat .16s ease-in-out infinite alternate}
@keyframes wBat{from{transform:scale(1.22,.86) translateY(2%)}to{transform:scale(.92,1.12) translateY(-8%)}}
body .sb .sym.s5.win .in{animation:wPotion .5s ease-in-out infinite}
@keyframes wPotion{0%,100%{transform:rotate(0) scale(1.08)}25%{transform:rotate(-12deg) scale(1.14)}75%{transform:rotate(12deg) scale(1.14)}}
body .sb .sym.s6.win .in{animation:wSpider .55s cubic-bezier(.4,1.6,.6,1) infinite alternate}
@keyframes wSpider{from{transform:translateY(-12%) scale(1.04)}to{transform:translateY(6%) scale(1.14,1.06)}}
.sb .sym.win .in::after{content:"";position:absolute;inset:10%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--wc) 55%,transparent),transparent 70%);z-index:-1;animation:wAura .5s ease-in-out infinite alternate}
.sb .sym .in{position:relative;isolation:isolate}
/* avec l'animation dessinée (flammes, bulles, chauves-souris…), pas de mouvement ni d'aura en plus */
body .sb .sym.win .in:has(.winimg){animation:none}
.sb .sym.win .in:has(.winimg)::after{display:none}
@keyframes wAura{from{transform:scale(.8);opacity:.6}to{transform:scale(1.25);opacity:1}}

/* ---- multiplicateurs qui volent vers le gain ---- */
.sb .flychip{position:absolute;transform:translate(-50%,-50%);z-index:5;font-family:var(--display);font-size:calc(var(--board)*.032);padding:.05em .45em;border-radius:999px;color:#1a0a24;
  background:linear-gradient(180deg,color-mix(in srgb,var(--t) 45%,#fff),var(--t) 60%);box-shadow:0 0 calc(var(--board)*.02) var(--t),0 2px 0 rgba(0,0,0,.4);pointer-events:none;white-space:nowrap}

/* ---- écran d'accueil ---- */
.sb-splash{position:fixed;inset:0;z-index:85;display:grid;place-items:center;padding:16px;overflow:hidden;cursor:pointer;
  background:radial-gradient(ellipse at 50% 40%,rgba(70,30,120,.75),rgba(8,3,16,.94) 70%);animation:fadeIn .4s}
.sb-splash::before{content:"";position:absolute;left:50%;top:42%;width:170vmax;height:170vmax;margin:-85vmax 0 0 -85vmax;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(255,170,60,.1) 0deg 7deg,transparent 7deg 16deg);animation:sbRays 30s linear infinite;-webkit-mask:radial-gradient(circle,#000 8%,transparent 55%);mask:radial-gradient(circle,#000 8%,transparent 55%)}
.sb-splash.out{animation:sbSplashOut .45s ease-in forwards}
@keyframes sbSplashOut{to{opacity:0;transform:scale(1.06)}}
.sb-splash .in{position:relative;display:flex;flex-direction:column;align-items:center;gap:min(2.6vh,22px);text-align:center;max-width:860px}
.sb-splash .logo{font-size:min(11vh,12vw)!important;animation:sbLogoIn .9s cubic-bezier(.3,1.5,.5,1)}
@keyframes sbLogoIn{from{transform:scale(.4) translateY(-20%);opacity:0}}
.sb-splash .demo{display:flex;gap:min(1.4vh,12px);justify-content:center}
.sb-splash .cell{position:relative;width:min(11vh,15vw);height:min(11vh,15vw);border-radius:22%;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03));box-shadow:inset 0 0 0 2px rgba(255,255,255,.12);display:grid;place-items:center}
.sb-splash .cell img{width:84%;height:84%;object-fit:contain;animation:sbIdle 3s ease-in-out infinite}
.sb-splash .cell b{position:absolute;right:-8%;bottom:-8%;font-family:var(--display);font-weight:400;font-size:min(3.2vh,4.4vw);padding:.04em .45em;border-radius:999px;color:#1a0a24;background:linear-gradient(180deg,color-mix(in srgb,var(--t) 45%,#fff),var(--t) 60%);box-shadow:0 0 14px var(--t),0 2px 0 rgba(0,0,0,.4);transition:background .2s}
.sb-splash .cell.lit{box-shadow:inset 0 0 0 3px var(--t),0 0 24px var(--t)}
.sb-splash .cell.lit b{animation:sbBadge .5s cubic-bezier(.3,1.8,.5,1)}
.sb-splash .tag{font-family:var(--display);font-size:min(4.4vh,6vw);line-height:1.1;background:linear-gradient(180deg,#fff6c8,#ffc23d 55%,#ff7a00);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 #3a0c00)}
.sb-splash .feats{display:flex;gap:min(2vw,18px);flex-wrap:wrap;justify-content:center}
.sb-splash .feats span{font-size:min(2.2vh,3.4vw);font-weight:700;color:#e8defe;background:rgba(20,10,40,.75);border:1px solid rgba(170,130,255,.4);border-radius:999px;padding:.4em 1em}
.sb-splash .go{font-family:var(--display);font-size:min(4.6vh,6.4vw);border:3px solid #ffdc8a;border-radius:999px;padding:.3em 1.6em;color:#3a1200;cursor:pointer;
  background:radial-gradient(circle at 40% 25%,#fff0b0,#ffa22a 45%,#e05a00);box-shadow:0 6px 0 #5a1a00,0 0 30px rgba(255,140,30,.6);animation:sbIdlePulse 2s ease-in-out infinite}
@media (max-height:300px){ .sb-splash .feats{display:none} .sb-splash .in{gap:6px} }
@media (prefers-reduced-motion: reduce){ .sb *,.sb-amb *,.sb-splash *{animation:none!important} }
'''

JS = r'''
/* ====================== Refonte visuelle : comportements ====================== */
function drawOutlines(wins){ const svg=$('winLines'); if(!svg) return; let h='';
  for(const w of wins){ const S=new Set(w.c); let d='';
    for(const i of w.c){ const r=(i/COLS)|0, c=i%COLS;
      if(r===0||!S.has(i-COLS)) d+=`M${c} ${r}H${c+1}`;
      if(r===ROWS-1||!S.has(i+COLS)) d+=`M${c} ${r+1}H${c+1}`;
      if(c===0||!S.has(i-1)) d+=`M${c} ${r}V${r+1}`;
      if(c===COLS-1||!S.has(i+1)) d+=`M${c+1} ${r}V${r+1}`; }
    h+=`<path class="wl" style="--g:${COLORS[w.s]}" d="${d}"/><path class="wl2" d="${d}"/>`;
    for(const i of w.c){ const s=spotEls[(i/COLS)|0][i%COLS]; s.style.setProperty('--g',COLORS[w.s]); s.classList.add('hit'); } }
  svg.innerHTML=h; }
function clearOutlines(){ const svg=$('winLines'); if(svg) svg.innerHTML=''; for(const row of spotEls) for(const s of row) s.classList.remove('hit'); }
function cellSize(){ return board.getBoundingClientRect().width/COLS; }
function ringFX(x,y,color,big){ if(reduced) return; const cs=cellSize();
  P({kind:'flash',x,y,size:cs*(big?.75:.55),decay:.11,color});
  P({kind:'ring',x,y,size:cs*.18,grow:cs*(big?.05:.035),decay:.065,color}); runFx(); }
function multFX(x,y,color){ if(reduced) return; const cs=cellSize();
  P({kind:'ring',x,y,size:cs*.12,grow:cs*.03,decay:.07,color}); burst(x,y,color,6); }
function fsFlash(){ if(reduced) return; const f=document.createElement('div'); f.className='sb-flash'; document.body.appendChild(f); setTimeout(()=>f.remove(),950); }
/* ---- sons : vrais fichiers audio (repli sur la synthèse s'ils ne sont pas chargés) ; tout passe par « muted » ---- */
const Snd=(()=>{ const names=['click','spin','land','win','pop','mult','scatter','tension','trigger','big','coin','fsEnd']; const buf={}; let started=false, master=null;
  function load(){ if(started) return; const a=A(); if(!a) return; started=true; master=a.createGain(); master.gain.value=.85; master.connect(a.destination);
    names.forEach(n=>fetch(`theme/halloween/sfx/${n}.mp3`).then(r=>r.arrayBuffer()).then(b=>a.decodeAudioData(b)).then(d=>{ buf[n]=d; }).catch(()=>{})); }
  function play(n,o={}){ if(muted) return true; const a=A(); if(!a) return false; if(!buf[n]){ load(); return false; }
    const s=a.createBufferSource(); s.buffer=buf[n]; s.playbackRate.value=o.rate||1; const g=a.createGain(); g.gain.value=o.vol==null?1:o.vol; s.connect(g).connect(master); s.start(a.currentTime+(o.delay||0)); return true; }
  return {load,play}; })();
(function(){ const S={...SFX}, L=[2,3,5,10,25,50,100];
  Object.assign(SFX,{
    click:()=>Snd.play('click',{vol:.55})||S.click(),
    land:c=>Snd.play('land',{rate:.9+c*.035,vol:.42})||S.land(c),
    pop:()=>Snd.play('pop',{rate:.9+rnd()*.25,vol:.7})||S.pop(),
    mark:()=>Snd.play('mult',{rate:.8,vol:.35})||S.mark(),
    mult:v=>Snd.play('mult',{rate:1+Math.max(0,L.indexOf(v))*.09,vol:.65})||S.mult(v),
    win:(step=1)=>Snd.play('win',{rate:Math.pow(2,Math.min(step-1,8)*2/12),vol:.7})||S.win(step),
    tension:k=>Snd.play('tension',{rate:1+k*.07,vol:.6})||S.tension(k),
    whoosh:()=>Snd.play('spin',{vol:.5})||S.whoosh(),
    scatter:i=>Snd.play('scatter',{rate:1+i*.12,vol:.8})||S.scatter(i),
    trigger:()=>Snd.play('trigger',{vol:.85})||S.trigger(),
    big:()=>Snd.play('big',{vol:.85})||S.big(),
    coin:()=>Snd.play('coin',{rate:.85+rnd()*.35,vol:.28})||S.coin(),
    fsEnd:()=>Snd.play('fsEnd',{vol:.8})
  });
  addEventListener('pointerdown',()=>Snd.load(),{once:true}); addEventListener('keydown',()=>Snd.load(),{once:true});
})();
/* ---- décor animé : chauves-souris et braises ---- */
(function(){ const amb=document.querySelector('.sb-amb'); if(!amb || reduced) return;
  const bat='<svg viewBox="0 0 100 50"><path d="M50 18 C46 12 42 12 40 16 C32 6 18 4 2 12 C10 16 12 22 10 30 C18 24 26 26 30 34 C34 28 40 28 44 34 Q47 30 50 34 Q53 30 56 34 C60 28 66 28 70 34 C74 26 82 24 90 30 C88 22 90 16 98 12 C82 4 68 6 60 16 C58 12 54 12 50 18Z"/></svg>';
  amb.querySelector('.bats').innerHTML=[0,1,2,3].map(i=>`<div class="bat" style="--s:${18+i*7}px;--y:${8+i*9}%;--d:${16+i*5}s;--w:${-i*6.5}s">${bat}</div>`).join('');
  amb.querySelector('.motes').innerHTML=Array.from({length:14},(_,i)=>`<div class="mote" style="--x:${(i*7.3+rnd()*5)%100}%;--s:${3+rnd()*5}px;--d:${9+rnd()*9}s;--w:${-rnd()*15}s;--dx:${(rnd()-.5)*12}vw"></div>`).join('');
})();
/* ---- multiplicateurs qui volent vers le gain du groupe ---- */
function flyMults(wins){ if(reduced) return; const fl=floatsEl;
  for(const w of wins){ if(!w.m) continue; let sr=0,sc=0; for(const i of w.c){ sr+=(i/COLS)|0; sc+=i%COLS; } sr/=w.c.length; sc/=w.c.length;
    let k=0; for(const i of w.c){ const r=(i/COLS)|0, c=i%COLS, v=spots[r][c]; if(v<2) continue;
      const ch=document.createElement('span'); ch.className='flychip'; ch.textContent='x'+v; ch.style.setProperty('--t',MULT_COLORS[v]||'#fff');
      ch.style.left=((c+.5)*100/COLS)+'%'; ch.style.top=((r+.5)*100/ROWS)+'%'; fl.appendChild(ch);
      const bw=board.getBoundingClientRect().width/COLS, dx=(sc-c)*bw, dy=(sr-r)*bw;
      ch.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.5)`,opacity:.2}],{duration:380,delay:k*30,easing:'cubic-bezier(.55,0,.85,.4)',fill:'forwards'});
      setTimeout(()=>ch.remove(),420+k*30); k++; } } }
/* ---- [228] Espace avec un panneau ouvert : on ferme le panneau, aucun spin ---- */
function closePanels(){ let was=false; for(const id of ['autoPanel','betPanel']){ const el=$(id); if(el && !el.hidden){ el.hidden=true; was=true; } } return was; }
addEventListener('keydown',e=>{ if((e.code==='Space'||e.key===' ') && closePanels()){ e.preventDefault(); } },true);
/* ---- panneau des mises ---- */
(function(){ const cell=$('betCell'), panel=$('betPanel');
  const close=()=>{ panel.hidden=true; cell.setAttribute('aria-expanded','false'); };
  const open=()=>{ if(!ready||busy||inFS||REPLAY){ return; } A(); SFX.click();
    if(!panel.hidden){ close(); return; }
    panel.querySelector('.chips').innerHTML=BETS.map((v,i)=>`<button type="button" data-i="${i}" class="${i===betIdx?'cur':''}">${fmt(v)}</button>`).join('');
    panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{ betIdx=+b.dataset.i; SFX.click(); updateUI(); close(); });
    panel.hidden=false; cell.setAttribute('aria-expanded','true');
    const r=cell.getBoundingClientRect(), pw=panel.offsetWidth;
    panel.style.left=Math.max(8,Math.min(innerWidth-pw-8, r.left+r.width/2-pw/2))+'px'; panel.style.bottom=(innerHeight-r.top+8)+'px'; };
  cell.onclick=open; cell.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); open(); } };
  addEventListener('pointerdown',e=>{ if(!panel.hidden && !panel.contains(e.target) && !cell.contains(e.target)) close(); });
  addEventListener('resize',close);
})();
/* ---- écran d'accueil ---- */
function sbSplash(){ return new Promise(res=>{
  const fr=LANG==='fr', L=[2,3,5,10,25,50,100], syms=[1,3,0,5,4];
  const el=document.createElement('div'); el.className='sb-splash'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.innerHTML=`<div class="in"><h1 class="logo" aria-label="Spooky Burst">${[...'SPOOKY'].map(c=>`<span>${c}</span>`).join('')}<b>BURST</b></h1>
    <div class="demo">${syms.map(s=>`<div class="cell"><img src="theme/halloween/symbols/${s}.png" alt=""><b style="--t:${MULT_COLORS[2]}">x2</b></div>`).join('')}</div>
    <div class="tag">${fr?'Les multiplicateurs grimpent jusqu’à x100':'Multipliers climb up to x100'}</div>
    <div class="feats"><span>${fr?'Groupes de 5+ symboles':'Clusters of 5+ symbols'}</span><span>${fr?'Les cases restent pendant les free spins':'Spots stay during free spins'}</span><span>${fr?'Gain max 25 000×':'Max win 25,000×'}</span></div>
    <button type="button" class="go">${fr?'Jouer':'Play'}</button></div>`;
  document.body.appendChild(el);
  const cells=[...el.querySelectorAll('.cell')]; let step=0;
  const tick=setInterval(()=>{ const c=cells[step%cells.length], b=c.querySelector('b'), cur=L.indexOf(+b.textContent.slice(1)), nv=L[(cur+1)%L.length];
    b.textContent='x'+nv; b.style.setProperty('--t',MULT_COLORS[nv]); c.style.setProperty('--t',MULT_COLORS[nv]); c.classList.remove('lit'); void c.offsetWidth; c.classList.add('lit'); step++; }, 420);
  const done=()=>{ if(el.classList.contains('out')) return; clearInterval(tick); A(); Snd.load(); Music.kick(); SFX.click(); el.classList.add('out'); setTimeout(()=>{ el.remove(); res(); },450); removeEventListener('keydown',key,true); };
  const key=e=>{ if(e.key==='Enter'||e.code==='Space'||e.key===' '){ e.preventDefault(); done(); } };
  el.onclick=done; addEventListener('keydown',key,true); el.querySelector('.go').focus({preventScroll:true});
}); }
/* échelle des multiplicateurs (colonne de droite) */
(function(){ const c=document.querySelector('#ladder .chips'); if(c) c.innerHTML=Object.entries(MULT_COLORS).map(([v,col])=>`<span style="--t:${col}">x${v}</span>`).join(''); })();
/* autoplay : bouton + panneau de choix (puis la confirmation existante) */
(function(){
  const btn=$('autoBtn'), panel=$('autoPanel'), sel=$('autoSel');
  const close=()=>{ panel.hidden=true; btn.setAttribute('aria-expanded','false'); };
  btn.onclick=()=>{ A(); SFX.click();
    if(autoLeft>0){ autoLeft=0; sel.value='0'; updateUI(); return; }
    if(!ready||busy||inFS){ close(); return; }
    if(!panel.hidden){ close(); return; }
    panel.hidden=false; btn.setAttribute('aria-expanded','true');
    const r=btn.getBoundingClientRect(), pw=panel.offsetWidth;
    panel.style.left=Math.max(8,Math.min(innerWidth-pw-8, r.left+r.width/2-pw/2))+'px';
    panel.style.bottom=(innerHeight-r.top+8)+'px'; };
  panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{ close(); SFX.click(); sel.value=b.dataset.n; sel.dispatchEvent(new Event('change')); });
  addEventListener('pointerdown',e=>{ if(!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close(); });
  addEventListener('resize',close);
})();
'''


def apply(s):
    def sub(old, new, count=1):
        nonlocal s
        assert s.count(old) == count, (s.count(old), old[:90])
        s = s.replace(old, new)

    # ---- nouvelle structure de l'écran
    a = s.index('<div class="app" id="app">')
    b = s.index('<canvas id="fx"></canvas>')
    s = s[:a] + DOM + '\n' + s[b:]

    # ---- styles (en dernier : ils priment)
    sub('</style>\n</head>', CSS + '</style>\n</head>')

    # ---- comportements
    sub("  document.documentElement.lang = LANG; paintMute();",
        "  document.documentElement.lang = LANG; paintMute();\n"
        "  set('tWinLbl',T.win); set('tLadder',LANG==='fr'?'Multiplicateurs':'Multipliers'); set('tAutoLbl',LANG==='fr'?'Spins automatiques':'Autoplay');\n"
        "  tip('autoBtn',LANG==='fr'?'Spins automatiques':'Autoplay'); tip('turboBtn','Turbo'); tip('muteBtn',muted?T.soundOn:T.soundOff);")
    sub("  sb.setAttribute('aria-label', autoLeft>0 ? T.stopAuto(autoLeft) : T.spinAria);",
        "  sb.setAttribute('aria-label', autoLeft>0 ? T.stopAuto(autoLeft) : T.spinAria);\n"
        "  { const ab=$('autoBtn'); if(ab){ ab.classList.toggle('on', autoLeft>0); ab.disabled = REPLAY || ((busy||inFS||!ready) && autoLeft===0); } }")
    # contour lumineux + cases allumées sous les groupes gagnants
    sub("  lastWins = e.wins;\n", "  lastWins = e.wins; drawOutlines(e.wins);\n")
    sub("function clearWinLook(){ symsEl.classList.remove('dimming');", "function clearWinLook(){ clearOutlines(); symsEl.classList.remove('dimming');")
    sub("  const big = new Set(lastWins.map(w => w.c[(w.c.length/2)|0]));", "  clearOutlines(); const big = new Set(lastWins.map(w => w.c[(w.c.length/2)|0]));")
    # explosions : éclair + onde de choc
    sub("for(let i=0;i<(big?26:12);i++) P({kind:'flame',x:x+(rnd()-.5)*18,y,vx:(rnd()-.5)*1.6,vy:-2.5-rnd()*4.5,g:-.02,size:14+rnd()*18,",
        "for(let i=0;i<(big?14:7);i++) P({kind:'flame',x:x+(rnd()-.5)*18,y,vx:(rnd()-.5)*1.6,vy:-2.5-rnd()*4.5,g:-.02,size:6+rnd()*8,")
    sub("function explodeFX(x,y,sym,big){\n  if(reduced) return;", "function explodeFX(x,y,sym,big){\n  if(reduced) return;\n  ringFX(x,y,COLORS[sym],big);")
    sub("    else if(p.kind==='smoke'){",
        "    else if(p.kind==='ring'){ p.size+=p.grow; ctx.globalAlpha=a; ctx.strokeStyle=p.color; ctx.lineWidth=Math.max(1.5,p.size*.16*p.life); ctx.shadowColor=p.color; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(0,0,p.size,0,7); ctx.stroke(); ctx.shadowBlur=0; }\n"
        "    else if(p.kind==='flash'){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a*.85; const gr=ctx.createRadialGradient(0,0,0,0,0,p.size); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.35,p.color); gr.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,p.size,0,7); ctx.fill(); }\n"
        "    else if(p.kind==='smoke'){")
    # multiplicateurs : étincelles à chaque cran
    sub("  for(const [i,v] of cells){ const [r,c]=cellRC(i); spots[r][c]=v; renderSpot(r,c,true); maxUp=Math.max(maxUp,v); }",
        "  for(const [i,v] of cells){ const [r,c]=cellRC(i); spots[r][c]=v; renderSpot(r,c,true); maxUp=Math.max(maxUp,v); const [x,y]=cellCenter(r,c); multFX(x,y,MULT_COLORS[v]||'#fff'); }")
    # entrée / sortie du bonus : éclair plein écran
    sub("        document.body.classList.add('fs');", "        fsFlash(); document.body.classList.add('fs');")
    sub("        document.body.classList.remove('fs');", "        fsFlash(); document.body.classList.remove('fs');")
    # symboles : léger flottement, décalé d'une case à l'autre
    sub("d.innerHTML='<div class=\"in\">'+symSVG(s)+'</div>'; return d; }",
        "d.innerHTML='<div class=\"in\">'+symSVG(s)+'</div>'; d.style.setProperty('--d',(-rnd()*4.2).toFixed(2)+'s'); return d; }")
    # replay : le conteneur de la grille a changé de classe
    sub("const machine=document.querySelector('.machine');", "const machine=document.querySelector('.sb-stage');")
    # icônes : le bouton son garde son pictogramme ; le bouton règles n'a plus de texte « ? »
    sub("</script>\n</body>", JS + "</script>\n</body>")
    # ---- multiplicateurs qui volent vers le gain
    sub("  lastWins = e.wins; drawOutlines(e.wins);\n", "  lastWins = e.wins; drawOutlines(e.wins); flyMults(e.wins);\n")
    # ---- son de fin de bonus
    sub("        if(e.maxed) await maxWinScreen(e.total/10*b);", "        if(e.maxed) await maxWinScreen(e.total/10*b); else SFX.fsEnd&&SFX.fsEnd();")
    # ---- écran d'accueil après l'authentification (avant la reprise d'une partie en cours)
    sub("    ready = true; busy = false; bootDone(); updateUI();\n", "    ready = true; busy = false; bootDone(); updateUI();\n    await sbSplash();\n")
    # la barre espace ne lance rien sous l'écran d'accueil
    sub("  if(document.querySelector('.ov,.bigwin,.boot')){", "  if(document.querySelector('.ov,.bigwin,.boot,.sb-splash,.sb-autopanel:not([hidden])')){")
    # les panneaux se ferment au début de chaque partie
    sub("  busy=true; resetSpots(); updateUI();\n  const t0 = Date.now();", "  busy=true; closePanels(); resetSpots(); updateUI();\n  const t0 = Date.now();")
    # le libellé du panneau des mises suit la langue et le mode social
    sub("  set('tWinLbl',T.win);", "  set('tWinLbl',T.win); set('tBetLbl',T.bet);")
    return s
