const {chromium}=require('playwright');const {start}=require('./serve');
(async()=>{const w=1920,h=1080;const srv=await start(8796);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const msaa of [4,2,0]){
  const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(`http://localhost:8796/index2.html?scene=s1.json&w=${w}&msaa=${msaa}`);await p.waitForFunction(()=>window.ready);
  await p.evaluate(()=>window.renderAt(10,{noblur:true}));await p.screenshot({type:'jpeg',quality:90});
  const t0=Date.now();for(let i=0;i<4;i++){await p.evaluate(i=>window.renderAt(10+i*0.02,{noblur:true}),i);await p.screenshot({type:'jpeg',quality:93});}
  console.log('msaa',msaa,((Date.now()-t0)/4).toFixed(0),'ms per frame (N=1, incl jpeg)');await p.close();}
 await b.close();srv.close();})();
