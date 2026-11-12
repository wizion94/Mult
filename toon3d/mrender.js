const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const [mode,out,...rest]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const k=mode==='still'?0:+rest[0];const srv=await start(8970+k);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('E',e.message));p.on('console',m=>{if(m.type()==='error')console.log('C',m.text())});
 await p.goto(`http://localhost:${8970+k}/mom30.html`);await p.waitForFunction(()=>window.ready,null,{timeout:40000});
 if(mode==='still'){for(const t of rest.map(Number)){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:`${out}/t${String(t).padStart(5,'0')}.png`});}}
 else{const K=+rest[1],fps=+rest[2],dur=+rest[3],N=Math.round(dur*fps);for(let n=k;n<N;n+=K){const fp=`${out}/${String(n).padStart(5,'0')}.jpg`;if(fs.existsSync(fp)&&fs.statSync(fp).size>20000)continue;await p.evaluate(t=>window.renderAt(t),n/fps);await p.screenshot({path:fp,type:'jpeg',quality:93});}}
 await b.close();srv.close();})();
