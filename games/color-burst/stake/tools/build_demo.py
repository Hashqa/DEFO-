"""
Version démo jouable dans un navigateur (sans serveur Stake) : prend stake/frontend/index.html et
remplace le serveur par un faux serveur intégré qui joue chaque partie avec le moteur (engine.js).
Écrit stake/demo/ (index.html + engine.js + theme/). Les gains de la démo suivent le moteur brut,
pas les poids des fichiers mathématiques publiés.
"""
import os, re, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
FRONT = os.path.join(HERE, '..', 'frontend'); OUT = os.path.join(HERE, '..', 'demo')
s = open(os.path.join(FRONT, 'index.html'), encoding='utf-8').read()

MOCK = r'''<script>
/* ===== Démo : faux serveur Stake intégré (aucun argent réel) ===== */
(function(){
  const E = SpookyEngine.create(), CUR = 'EUR';
  let bal = 1000e6, round = null;
  const config = { minBet:100000, maxBet:100000000, stepBet:100000, defaultBetLevel:1000000,
    betLevels:[100000,200000,400000,600000,800000,1000000,2000000,4000000,5000000,10000000,20000000,50000000,100000000],
    jurisdiction:{ socialCasino:false, disabledTurbo:false, disabledAutoplay:false, disabledBuyFeature:false, disabledSpacebar:false, minimumRoundDuration:0 } };
  const real = window.fetch.bind(window), BASE = 'https://demo.rgs';
  const json = (o, st=200) => new Response(JSON.stringify(o), { status:st, headers:{ 'Content-Type':'application/json' } });
  window.fetch = async (url, opts={}) => {
    const u = String(url); if (!u.startsWith(BASE)) return real(url, opts);
    const path = u.slice(BASE.length), q = opts.body ? JSON.parse(opts.body) : {};
    await new Promise(r => setTimeout(r, 90));
    const B = () => ({ amount:bal, currency:CUR });
    switch (path) {
      case '/wallet/authenticate': return json({ balance:B(), config, round:null });
      case '/wallet/balance': return json({ balance:B() });
      case '/wallet/play': {
        if (round && round.active) return json({ error:'ERR_VAL', message:'round active' }, 400);
        const M = E.config.MODES[q.mode]; if (!M) return json({ error:'ERR_VAL' }, 400);
        const cost = Math.round(q.amount * M.cost);
        if (cost > bal) bal = 1000e6;                       // démo : solde rechargé automatiquement
        bal -= cost;
        const r = E.playRound(q.mode), payout = Math.round(q.amount * r.payoutMultiplier / 100);
        round = { amount:q.amount, mode:q.mode, payoutMultiplier:r.payoutMultiplier/100, payout, active:payout>0, state:r.events };
        return json({ balance:B(), round });
      }
      case '/wallet/end-round': if (round && round.active) { bal += round.payout; round.active = false; } return json({ balance:B() });
    }
    return json({ error:'ERR_VAL' }, 400);
  };
})();
</script>
'''
def sub(a, b):
    global s
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
sub('<script src="engine.js"></script>\n', '<script src="engine.js"></script>\n' + MOCK)
sub("const Q = new URLSearchParams(location.search);",
    "const Q = new URLSearchParams('sessionID=demo&rgs_url=https://demo.rgs&lang=' + ((navigator.language||'en').toLowerCase().startsWith('fr')?'fr':'en'));")
# page servie dans un squelette : pas de doctype / html / head / body propres
for a in ['<!doctype html>\n', '<html lang="en">\n', '<head>\n', '</head>\n', '<body>\n', '</body>\n', '</html>']:
    s = s.replace(a, '', 1)
s = re.sub(r'<meta charset="utf-8">\n', '', s, count=1)
s = re.sub(r'<meta name="viewport"[^>]*>\n', '', s, count=1)
s = s.replace('<link rel="icon" href="data:,">\n', '')
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
shutil.copy(os.path.join(FRONT, 'engine.js'), os.path.join(OUT, 'engine.js'))
shutil.copytree(os.path.join(FRONT, 'theme'), os.path.join(OUT, 'theme'))
print('démo écrite dans', OUT)
