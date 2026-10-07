// Symboles en haute définition (1024 px) pour la tuile 3:4 et la couverture 16:9
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://'+__dirname+'/studio.html');await p.waitForFunction(()=>document.title==='ready');
const OUT=__dirname+'/../theme/halloween/hires'; fs.mkdirSync(OUT,{recursive:true});
for(let i=0;i<8;i++){ const u=await p.evaluate(i=>studio.symbolPNG(i,1024),i); fs.writeFileSync(`${OUT}/${i}.png`,Buffer.from(u.split(',')[1],'base64')); }
await b.close();})();
