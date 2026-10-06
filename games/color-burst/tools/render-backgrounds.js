const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [hash,out] of [['',__dirname+'/../theme/halloween/background.jpg'],['#fs',__dirname+'/../theme/halloween/background-fs.jpg']]){
 const p=await b.newPage({viewport:{width:1920,height:1080}});const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.goto('file://'+__dirname+'/painter.html'+hash);await p.waitForFunction(()=>document.title==='done',null,{timeout:120000});
 await p.screenshot({path:out,type:'jpeg',quality:86});console.log(out,e);await p.close();}
await b.close();})();
