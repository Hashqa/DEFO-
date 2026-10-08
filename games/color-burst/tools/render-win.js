// Animations de gain (theme/halloween/win/<n>.webp) dessinées autour des symboles actuels (theme/halloween/symbols/<n>.png).
// Ne touche pas aux images des symboles.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');const {execSync}=require('child_process');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+__dirname+'/studio.html');await p.waitForFunction(()=>document.title==='ready');
const SYM=__dirname+'/../theme/halloween/symbols', OUT=__dirname+'/../theme/halloween/win', TMP=require('os').tmpdir()+'/cb-win'; fs.mkdirSync(TMP,{recursive:true});
const save=(u,f)=>fs.writeFileSync(f,Buffer.from(u.split(',')[1],'base64'));
const N=20;
for(let i=0;i<8;i++){ const url='data:image/png;base64,'+fs.readFileSync(`${SYM}/${i}.png`).toString('base64'); await p.evaluate(([i,u])=>studio.useImage(i,u),[i,url]);
  execSync(`rm -f ${TMP}/*.png`); for(let f=0;f<N;f++) save(await p.evaluate(([i,f,N])=>studio.winFrame(i,f,N),[i,f,N]),`${TMP}/f${String(f).padStart(3,'0')}.png`);
  execSync(`ffmpeg -y -loglevel error -framerate 24 -i ${TMP}/f%03d.png -c:v libwebp_anim -lossless 0 -q:v 60 -compression_level 6 -loop 0 -pix_fmt yuva420p ${OUT}/${i}.webp`);
  if(i===0||i===4) fs.copyFileSync(`${TMP}/f005.png`, `${TMP}/../cb-win-sample-${i}.png`); }
console.log('errors',e);await b.close();})();
