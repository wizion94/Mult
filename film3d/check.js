// node check.js [scene.json]  -> prints collisions grouped by part/obstacle with time ranges
const {chromium}=require('playwright');const {start}=require('./serve');
(async()=>{const scene=process.argv[2]||'scene1.json';const srv=await start(8792);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();p.on('pageerror',e=>console.log('E',e.message));
 await p.goto('http://localhost:8792/index.html?scene='+scene);await p.waitForFunction(()=>window.ready||window.err,null,{timeout:60000});
 const err=await p.evaluate(()=>window.err);if(err){console.log(err);process.exit(1)}
 const res=await p.evaluate((M)=>{const o=[];const D=window.meta.duration;for(let t=0;t<D;t+=1/24){for(const c of window.collide(t, M))o.push({t,...c});}return o},+(process.argv[3]||0));
 const g={};for(const r of res){const k=r.part+' -> '+r.obstacle;(g[k]=g[k]||[]).push(r);}
 const rows=Object.entries(g).map(([k,a])=>{const ts=a.map(x=>x.t);return {k,from:Math.min(...ts),to:Math.max(...ts),n:new Set(ts.map(x=>x.toFixed(3))).size,max:Math.max(...a.map(x=>x.depth))}}).sort((a,b)=>a.from-b.from);
 console.log(rows.length?rows.map(r=>`${r.k.padEnd(26)} t=${r.from.toFixed(1)}..${r.to.toFixed(1)}  frames=${r.n}  maxDepth=${(r.max*100).toFixed(0)}cm`).join('\n'):'NO COLLISIONS');
 const frames=new Set(res.map(r=>r.t.toFixed(3)));console.log('frames with any collision:',frames.size,'of',Math.round(p&&34*24));
 await b.close();srv.close();})();
