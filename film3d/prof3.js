const {chromium}=require('playwright');const {start}=require('./serve');
(async()=>{const w=1920,h=1080;const srv=await start(8797);
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(`http://localhost:8797/index2.html?scene=s1.json&w=${w}`);await p.waitForFunction(()=>window.ready);
 await p.evaluate(()=>window.renderAt(10,{noblur:true}));await p.screenshot({type:'jpeg'});
 const sync=()=>p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const u=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,u);});
 let t0;
 for(let i=0;i<3;i++){await p.evaluate(i=>window.renderAt(10+i*.02,{noblur:true}),i);await sync();t0=Date.now();await p.screenshot({type:'jpeg',quality:93});console.log('screenshot jpeg (GPU idle)',Date.now()-t0,'ms');}
 for(let i=0;i<3;i++){await p.evaluate(i=>window.renderAt(10+i*.02,{noblur:true}),i);await sync();t0=Date.now();const u=await p.evaluate(()=>document.querySelector('canvas').toDataURL('image/jpeg',0.93));console.log('toDataURL jpeg',Date.now()-t0,'ms',u.length);}
 t0=Date.now();for(let i=0;i<3;i++){await p.evaluate(i=>window.renderAt(10+i*.02,{noblur:true}),i);await sync();}console.log('render+sync N=1 avg',((Date.now()-t0)/3).toFixed(0),'ms');
 await b.close();srv.close();})();
