const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');const {execSync}=require('child_process');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+__dirname+'/studio.html');await p.waitForFunction(()=>document.title==='ready');
const OUT=__dirname+'/../theme/halloween', TMP=require('os').tmpdir()+'/cb-frames'; fs.mkdirSync(TMP,{recursive:true});
const save=(u,f)=>fs.writeFileSync(f,Buffer.from(u.split(',')[1],'base64'));
for(let i=0;i<8;i++){ save(await p.evaluate(i=>studio.symbolPNG(i),i),`${OUT}/symbols/${i}.png`); }
const N=20;
for(let i=0;i<8;i++){ execSync(`rm -f ${TMP}/*.png`); for(let f=0;f<N;f++) save(await p.evaluate(([i,f,N])=>studio.winFrame(i,f,N),[i,f,N]),`${TMP}/f${String(f).padStart(3,'0')}.png`);
  execSync(`ffmpeg -y -loglevel error -framerate 24 -i ${TMP}/f%03d.png -c:v libwebp_anim -lossless 0 -q:v 55 -compression_level 6 -loop 0 -pix_fmt yuva420p ${OUT}/win/${i}.webp`); }
console.log('errors',e);await b.close();})();
