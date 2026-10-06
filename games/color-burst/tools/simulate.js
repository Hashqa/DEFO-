// Simulateur : rejoue la logique exacte de ../index.html (mêmes constantes).
// Usage : node tools/simulate.js spins 100000   |   node tools/simulate.js n 1000   (achats de bonus)   |   node tools/simulate.js floor
// Reprend les constantes exactes de la page et rejoue l'achat de bonus comme le jeu
const fs=require('fs');const h=fs.readFileSync(__dirname+'/../index.html','utf8');
const grab=n=>{const m=h.match(new RegExp('const '+n+' = ([^;]+);'));return eval('('+m[1].replace(/\/\/.*$/gm,'')+')');};
const PAY=grab('PAYTABLE'),BW=grab('BASE_WEIGHTS'),SCW=grab('SCATTER_W'),BB=grab('BOOST_BASE'),MAXM=grab('MAX_MULT'),CAPX=grab('MAX_WIN_X');
const m2=h.match(/const BOOST_FS = ([\d.]+), BOOST_FS_HOT = ([\d.]+), HOT_CHANCE = ([\d.]+);/);const [FB,FH,HC]=m2.slice(1).map(Number);
const m3=h.match(/const BUY_STD = (\d+), BUY_SUP = (\d+);/);const [PS,PU]=m3.slice(1).map(Number);
const AW={3:10,4:12,5:15,6:20,7:30},fsFor=n=>n>=7?30:(AW[n]||0);
let W,T;function prof(fs){const w=BW.slice();w[(Math.random()*7)|0]+=fs?(Math.random()<HC?FH:FB):BB;W=[...w,SCW];T=W.reduce((a,b)=>a+b);}
function pick(){let x=Math.random()*T;for(let i=0;i<8;i++){x-=W[i];if(x<0)return i;}return 0;}
function clusters(g){const seen=g.map(r=>r.map(()=>0)),out=[];for(let r=0;r<7;r++)for(let c=0;c<7;c++){const s=g[r][c];if(seen[r][c]||s===7)continue;const st=[[r,c]],cells=[];seen[r][c]=1;while(st.length){const[y,x]=st.pop();cells.push([y,x]);for(const[dy,dx]of[[1,0],[-1,0],[0,1],[0,-1]]){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<7&&nx>=0&&nx<7&&!seen[ny][nx]&&g[ny][nx]===s){seen[ny][nx]=1;st.push([ny,nx]);}}}if(cells.length>=5)out.push({s,cells});}return out;}
function spin(sp,fs,force,cap){prof(fs);const g=Array.from({length:7},()=>Array.from({length:7},pick));
 if(force){let have=g.flat().filter(x=>x===7).length;for(const c of [0,1,2,3,4,5,6].sort(()=>Math.random()-.5)){if(have>=force)break;if(g.some(r=>r[c]===7))continue;g[(Math.random()*7)|0][c]=7;have++;}}
 let win=0;for(;;){const cl=clusters(g);if(!cl.length)break;const rm=new Set();
  for(const k of cl){let m=0;for(const[r,c]of k.cells)if(sp[r][c]>=2)m+=sp[r][c];win+=PAY[k.s][Math.min(k.cells.length,15)-5]*(m||1);k.cells.forEach(([r,c])=>rm.add(r*7+c));}
  if(win>=cap)return{win:cap,sc:0,max:1};
  for(const k of cl)for(const[r,c]of k.cells){const v=sp[r][c];sp[r][c]=v===0?2:Math.min(v*2,MAXM);}
  for(let c=0;c<7;c++){const col=[];for(let r=6;r>=0;r--)if(!rm.has(r*7+c))col.push(g[r][c]);while(col.length<7)col.push(pick());for(let r=6,i=0;r>=0;r--,i++)g[r][c]=col[i];}}
 return{win,sc:g.flat().filter(x=>x===7).length,max:0};}
const Z=v=>Array.from({length:7},()=>Array(7).fill(v));
function buy(sup){const first=spin(Z(0),0,Math.random()<.18?4:3,CAPX);let n=fsFor(Math.max(3,first.sc)),tot=0,played=0,best=0;const sp=Z(sup?2:0);
 while(n>0){n--;played++;const r=spin(sp,1,0,CAPX-tot);tot+=r.win;if(r.max)break;if(r.sc>=3)n+=5;}
 for(const row of sp)for(const v of row)best=Math.max(best,v);const MINX=+(h.match(/const MIN_BONUS_X = (\d+)/)||[0,0])[1];tot=Math.max(tot,MINX);return{total:first.win+tot,played,best};}
function report(sup,N=100){const price=sup?PU:PS,res=[];for(let i=0;i<N;i++)res.push(buy(sup));const t=res.map(r=>r.total).sort((a,b)=>a-b);const sum=t.reduce((a,b)=>a+b);
 const bk=[[0,10],[10,25],[25,50],[50,100],[100,200],[200,500],[500,1e9]].map(([a,b])=>t.filter(x=>x>=a&&x<b).length);
 return{modele:sup?'Super bonus':'Bonus',prix:price,depense:price*N,gagne:+sum.toFixed(2),retour:+(100*sum/(price*N)).toFixed(1),gagnants:t.filter(x=>x>=price).length,median:+t[N>>1].toFixed(2),pire:+t[0].toFixed(2),meilleur:+t[N-1].toFixed(2),tranches:bk,spinsMoy:+(res.reduce((a,r)=>a+r.played,0)/N).toFixed(1),meilleureCase:Math.max(...res.map(r=>r.best))};}
if(process.argv[2]==='n'){console.log(JSON.stringify(report(false,+process.argv[3])));console.log(JSON.stringify(report(true,+process.argv[3])));}
if(process.argv[2]==='rep'){for(const sup of [false,true]){const r=[];for(let i=0;i<30;i++)r.push(report(sup).retour);r.sort((a,b)=>a-b);console.log((sup?'Super':'Bonus')+' 30 séries de 100 : min '+r[0]+'% | médiane '+r[15]+'% | max '+r[29]+'% | moyenne '+(r.reduce((a,b)=>a+b)/30).toFixed(1)+'%');}}
if(process.argv[2]==='floor'){for(const sup of [false,true]){const price=sup?PU:PS;const t=[];for(let i=0;i<2000;i++)t.push(buy(sup).total);
 const base=t.reduce((a,b)=>a+b)/t.length;
 const out=[0.1,0.15,0.2,0.3].map(f=>{const fl=price*f;const m=t.reduce((a,x)=>a+Math.max(x,fl),0)/t.length;return `min ${fl}: retour ${(100*m/price).toFixed(1)}%, concerne ${(100*t.filter(x=>x<fl).length/t.length).toFixed(0)}%`});
 console.log((sup?'Super':'Bonus')+' sans minimum '+(100*base/price).toFixed(1)+'% | '+out.join(' | '));}}
function natBonus(n){ let tot=0; const sp=Z(0); while(n>0){ n--; const r=spin(sp,1,0,CAPX-tot); tot+=r.win; if(r.max) break; if(r.sc>=3) n+=5; } const MINX=+(h.match(/const MIN_BONUS_X = (\d+)/)||[0,0])[1]; return Math.max(tot,MINX); }
function spinsTest(N){ let mise=0,gain=0,hits=0,bonus=0,bonusGain=0,best=0,big=[0,0,0]; const bal=[];
  for(let i=0;i<N;i++){ mise+=1; const r=spin(Z(0),0,0,CAPX); let w=r.win; if(w>0) hits++;
    if(r.sc>=3){ bonus++; const bw=natBonus(fsFor(r.sc)); bonusGain+=bw; w+=bw; }
    gain+=w; best=Math.max(best,w); if(w>=20) big[0]++; if(w>=100) big[1]++; if(w>=1000) big[2]++; }
  return {spins:N, mise, gagne:+gain.toFixed(2), retour:+(100*gain/mise).toFixed(1), spinsGagnants:+(100*hits/N).toFixed(1), bonus, bonusTous:bonus?Math.round(N/bonus):null, gainBonus:+bonusGain.toFixed(2), partBonus:+(100*bonusGain/Math.max(gain,1e-9)).toFixed(0), meilleur:+best.toFixed(2), gains20:big[0], gains100:big[1], gains1000:big[2]}; }
if(process.argv[2]==='spins'){ console.log(JSON.stringify(spinsTest(+process.argv[3]))); }
