const {chromium}=require('playwright');const {start}=require('./serve');
(async()=>{const W=+process.argv[2]||1920,H=Math.round(W*9/16);const srv=await start(8793);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:W,height:H}});await p.goto('http://localhost:8793/index.html');await p.waitForFunction(()=>window.ready);
 const t0=Date.now();for(let i=0;i<20;i++){await p.evaluate(t=>window.renderAt(t),10+i/24);await p.screenshot({path:'/tmp/b.png'});}
 console.log(W+'x'+H,((Date.now()-t0)/20).toFixed(0),'ms/frame (engine fixed at 1280x720 render target; screenshot at',W,')');await b.close();srv.close();})();
