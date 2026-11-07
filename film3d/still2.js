// node still2.js scene.json outdir w t1 t2 ...
const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const scene=process.argv[2],out=process.argv[3],w=+process.argv[4],ts=process.argv.slice(5).map(Number);fs.mkdirSync(out,{recursive:true});
 const srv=await start(8794);const h=Math.round(w*9/16);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:w,height:h}});p.on('console',m=>console.log('C',m.text()));p.on('pageerror',e=>console.log('E',e.message));
 await p.goto(`http://localhost:8794/index2.html?scene=${scene}&w=${w}`);await p.waitForFunction(()=>window.ready||window.err,null,{timeout:90000});
 const err=await p.evaluate(()=>window.err);if(err){console.log(err);process.exit(1)}
 for(const t of ts){const t0=Date.now();const r=await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:`${out}/t${String(t).padStart(6,'0')}.png`});console.log('t',t,'subframes',r.N,'motionPx',r.mp.toFixed(1),(Date.now()-t0)+'ms');}
 await b.close();srv.close();})();
