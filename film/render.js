const {chromium}=require('playwright');const fs=require('fs');
const out=process.argv[2], k=+process.argv[3]||0, K=+process.argv[4]||1, FPS=24;
const story=JSON.parse(fs.readFileSync(__dirname+'/story.json'));
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});
 pg.on('pageerror',e=>console.log('PAGEERR',e.message));
 await pg.goto('file://'+__dirname+'/stage.html');fs.mkdirSync(out,{recursive:true});let n=0;
 for(const f of story.frames){
  const cnt=Math.round((f.end-f.start)*FPS);
  for(let i=0;i<cnt;i++,n++){
   if(n%K!==k)continue;
   await pg.evaluate(([id,t,d])=>window.draw(id,t,d),[f.id,i/FPS,f.end-f.start]);
   await pg.screenshot({path:`${out}/${String(n).padStart(5,'0')}.png`});
  }}
 await b.close();})();
