// node check2.js scene.json [margin] [fps]
const {chromium}=require('playwright');const {start}=require('./serve');
(async()=>{const scene=process.argv[2],M=+(process.argv[3]||0),fps=+(process.argv[4]||24);const srv=await start(8798);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>console.log('E',e.message));
 await p.goto(`http://localhost:8798/index2.html?scene=${scene}&w=640`);await p.waitForFunction(()=>window.ready||window.err,null,{timeout:90000});
 const err=await p.evaluate(()=>window.err);if(err){console.log(err);process.exit(1)}
 const res=await p.evaluate(([M,fps])=>{const o=[];const D=window.meta.duration;for(let t=0;t<D;t+=1/fps){for(const c of window.collide(t,M))o.push({t,...c});}return o},[M,fps]);
 const g={};for(const r of res){const k=r.part+' -> '+r.obstacle;(g[k]=g[k]||[]).push(r);}
 const rows=Object.entries(g).map(([k,a])=>{const ts=a.map(x=>x.t);return {k,from:Math.min(...ts),to:Math.max(...ts),n:new Set(ts.map(x=>x.toFixed(3))).size,max:Math.max(...a.map(x=>x.depth))}}).sort((a,b)=>a.from-b.from);
 console.log(scene+': '+(rows.length?'\n'+rows.map(r=>`  ${r.k.padEnd(30)} t=${r.from.toFixed(1)}..${r.to.toFixed(1)} frames=${r.n} maxDepth=${(r.max*100).toFixed(0)}cm`).join('\n'):'NO COLLISIONS'));
 await b.close();srv.close();})();
