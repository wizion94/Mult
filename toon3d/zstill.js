const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const out=process.argv[2],ts=process.argv.slice(3).map(Number);fs.mkdirSync(out,{recursive:true});const srv=await start(8951);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('console',m=>console.log('C',m.text()));p.on('pageerror',e=>console.log('E',e.message));
 await p.goto('http://localhost:8951/zylox.html');await p.waitForFunction(()=>window.ready,null,{timeout:90000});
 for(const t of ts){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:`${out}/t${String(t).padStart(5,'0')}.png`});}
 await b.close();srv.close();})();
