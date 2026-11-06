const {chromium}=require('playwright');const fs=require('fs');
const out=process.argv[2];const story=JSON.parse(fs.readFileSync(__dirname+'/story.json'));
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});
 pg.on('pageerror',e=>console.log('PAGEERR',e.message));
 await pg.goto('file://'+__dirname+'/stage.html');fs.mkdirSync(out,{recursive:true});
 for(const f of story.frames){const d=f.end-f.start;
  try{await pg.evaluate(([id,t,d])=>window.draw(id,t,d),[f.id,Math.min(d*0.8,3.2),d]);}catch(e){console.log('ERR',f.id,e.message.split('\n')[0]);continue}
  await pg.screenshot({path:`${out}/${f.id}.png`});}
 await b.close();})();
