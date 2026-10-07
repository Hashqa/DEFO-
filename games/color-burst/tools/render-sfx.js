// Rend les effets sonores de tools/sfx.html en MP3 : theme/halloween/sfx/<nom>.mp3
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');const {execSync}=require('child_process');const os=require('os');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/sfx.html');await p.waitForFunction(()=>document.title==='ready');
const OUT=__dirname+'/../theme/halloween/sfx', TMP=os.tmpdir()+'/cb-sfx'; fs.mkdirSync(OUT,{recursive:true}); fs.mkdirSync(TMP,{recursive:true});
for(const n of await p.evaluate(()=>sfx.names)){ const b64=await p.evaluate(n=>sfx.render(n),n); fs.writeFileSync(`${TMP}/${n}.wav`,Buffer.from(b64,'base64'));
  execSync(`ffmpeg -y -loglevel error -i ${TMP}/${n}.wav -ac 2 -b:a 112k ${OUT}/${n}.mp3`); console.log(n, fs.statSync(`${OUT}/${n}.mp3`).size); }
console.log('errors',errs);await b.close();})();
