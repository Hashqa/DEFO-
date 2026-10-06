const {chromium}=require(process.env.PW);const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--ignore-certificate-errors']});
const OUT=__dirname+'/../stake/tile-layers/';
const save=(u,f)=>fs.writeFileSync(f,Buffer.from(u.split(',')[1],'base64'));
// 1) premier plan : chaudron en éruption, grand format, fond transparent (quelques images au choix)
const p=await b.newPage();await p.goto('file://'+__dirname+'/studio.html');await p.waitForFunction(()=>document.title==='ready');
save(await p.evaluate(()=>studio.winFrame(0,7,20,1400)),OUT+'foreground-cauldron.png');
// 2) titre seul, fond transparent  3) fonds sans texte
const q=await b.newPage({viewport:{width:1920,height:1600}});
await q.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&display=swap">
<style>body{margin:0;background:transparent}#t{display:inline-block;padding:40px 60px;font-family:"Lilita One",sans-serif;line-height:.86;text-align:center}
.w{display:block;position:relative;font-size:260px}.w::before{content:attr(data-t);position:absolute;left:0;right:0;color:#1a0526;transform:translateY(.09em);-webkit-text-stroke:.09em #1a0526;z-index:-1}
.a{background:linear-gradient(180deg,#fff7c2 0%,#ffc23d 40%,#ff6a00 75%,#c22d00 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.02em #3a0a00}
.fa{filter:drop-shadow(0 0 30px rgba(255,140,30,.55))}.fg{filter:drop-shadow(0 0 30px rgba(60,255,120,.55))}
.g{background:linear-gradient(180deg,#eaffef 0%,#7dff9e 40%,#22c55e 75%,#0f6b30 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.02em #062a12}
#bg169{width:1920px;height:1080px;background:url(file://${__dirname}/../theme/halloween/background.jpg) center/cover}
#bg34{width:1200px;height:1600px;background:url(file://${__dirname}/../theme/halloween/background.jpg) 72% center/cover}</style>
<div id="t"><div class="fa"><span class="w a" data-t="SPOOKY">SPOOKY</span></div><div class="fg"><span class="w g" data-t="BURST">BURST</span></div></div><div id="bg169"></div><div id="bg34"></div>`);
await q.waitForTimeout(2500);
await (await q.$('#t')).screenshot({path:OUT+'game-title.png',omitBackground:true});
console.log('ok', await q.evaluate(()=>document.fonts.check('40px "Lilita One"')));await b.close();})();
