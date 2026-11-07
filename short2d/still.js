const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const out=process.argv[2],ts=process.argv.slice(3).map(Number);fs.mkdirSync(out,{recursive:true});const srv=await start(8901);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('console',m=>console.log('C',m.text()));p.on('pageerror',e=>console.log('E',e.message));
 await p.goto('http://localhost:8901/index.html');await p.waitForFunction(()=>window.ready,null,{timeout:30000});
 for(const t of ts){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:`${out}/t${String(t).padStart(5,'0')}.jpg`,type:'jpeg',quality:90});}
 await b.close();srv.close();})();
