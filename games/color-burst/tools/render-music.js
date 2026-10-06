const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');const {execSync}=require('child_process');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+__dirname+'/music.html');await p.waitForFunction(()=>document.title==='ready');
const b64=await p.evaluate(()=>render());const WAV=require('os').tmpdir()+'/cb-music.wav', MP3=__dirname+'/../theme/halloween/music.mp3';
fs.writeFileSync(WAV,Buffer.from(b64,'base64'));
execSync(`ffmpeg -y -loglevel error -i ${WAV} -c:a libmp3lame -b:a 160k ${MP3}`);
console.log('errors',e, fs.statSync(MP3).size);await b.close();})();
