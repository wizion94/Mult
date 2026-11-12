// node mwrender.js still OUT t1 t2 ...   |   node mwrender.js frames OUT shard shards fps dur
const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const [mode,out,...r]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const k=mode==='still'?0:+r[0];const srv=await start(8990+k);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('E',e.message));
 await p.goto(`http://localhost:${8990+k}/mw.html`);await p.waitForFunction(()=>window.ready,null,{timeout:30000});
 if(mode==='still'){for(const t of r.map(Number)){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:`${out}/t${String(t).padStart(5,'0')}.png`});}}
 else{const K=+r[1],fps=+r[2],N=Math.round(+r[3]*fps);for(let n=k;n<N;n+=K){const fp=`${out}/${String(n).padStart(5,'0')}.jpg`;if(fs.existsSync(fp)&&fs.statSync(fp).size>15000)continue;await p.evaluate(t=>window.renderAt(t),n/fps);await p.screenshot({path:fp,type:'jpeg',quality:93});}}
 await b.close();srv.close();})();
