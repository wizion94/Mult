// node render3d.js outdir shard shards [scene.json]
const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const out=process.argv[2],k=+process.argv[3]||0,K=+process.argv[4]||1,scene=process.argv[5]||'scene1.json';fs.mkdirSync(out,{recursive:true});
 const srv=await start(8800+k);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('E',e.message));
 await p.goto(`http://localhost:${8800+k}/index.html?scene=${scene}`);await p.waitForFunction(()=>window.ready||window.err,null,{timeout:60000});
 const err=await p.evaluate(()=>window.err);if(err){console.log(err);process.exit(1)}
 const {duration,fps}=await p.evaluate(()=>window.meta);const N=Math.round(duration*fps);
 for(let n=k;n<N;n+=K){await p.evaluate(t=>window.renderAt(t),n/fps);await p.screenshot({path:`${out}/${String(n).padStart(5,'0')}.png`});}
 await b.close();srv.close();})();
