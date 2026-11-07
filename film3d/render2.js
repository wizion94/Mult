// node render2.js scene.json outdir shard shards w fps [from to]   (frame indices on the i/fps grid)
const {chromium}=require('playwright');const {start}=require('./serve');const fs=require('fs');
(async()=>{const [scene,out,k,K,w,fps,f0,f1]=[process.argv[2],process.argv[3],+process.argv[4],+process.argv[5],+process.argv[6],+process.argv[7],process.argv[8],process.argv[9]];
 fs.mkdirSync(out,{recursive:true});const srv=await start(8810+k);const h=Math.round(w*9/16);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>console.log('E',e.message));
 await p.goto(`http://localhost:${8810+k}/index2.html?scene=${scene}&w=${w}&fps=${fps}`);await p.waitForFunction(()=>window.ready||window.err,null,{timeout:120000});
 const err=await p.evaluate(()=>window.err);if(err){console.log(err);process.exit(1)}
 const {duration}=await p.evaluate(()=>window.meta);const N=Math.round(duration*fps);const a=f0!==undefined?+f0:0,e=f1!==undefined?+f1:N;
 let t0=Date.now(),c=0;
 for(let n=a+k;n<e;n+=K){const fp=`${out}/${String(n).padStart(6,'0')}.jpg`;if(fs.existsSync(fp)&&fs.statSync(fp).size>20000)continue;await p.evaluate(t=>window.renderAt(t),n/fps);await p.screenshot({path:`${out}/${String(n).padStart(6,'0')}.jpg`,type:'jpeg',quality:93});c++;}
 console.log(`shard ${k}: ${c} frames in ${((Date.now()-t0)/1000).toFixed(1)}s (${((Date.now()-t0)/c).toFixed(0)} ms/frame)`);
 await b.close();srv.close();})();
