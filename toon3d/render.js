const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const out=process.argv[2],k=+process.argv[3],K=+process.argv[4],fps=+process.argv[5],dur=+process.argv[6];fs.mkdirSync(out,{recursive:true});const srv=await start(8940+k);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('E',e.message));
 await p.goto(`http://localhost:${8940+k}/index.html`);await p.waitForFunction(()=>window.ready,null,{timeout:60000});
 const N=Math.round(dur*fps);for(let n=k;n<N;n+=K){await p.evaluate(t=>window.renderAt(t),n/fps);await p.screenshot({path:`${out}/${String(n).padStart(5,'0')}.jpg`,type:'jpeg',quality:93});}
 await b.close();srv.close();})();
