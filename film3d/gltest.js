const {chromium}=require('playwright');const {spawn}=require('child_process');
const srv=spawn('python3',['-m','http.server','8765'],{cwd:__dirname,stdio:'ignore'});
(async()=>{await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:640,height:360}});p.on('console',m=>console.log('C',m.text()));p.on('pageerror',e=>console.log('E',e.message));
 await p.goto('http://localhost:8765/gltest.html');await p.waitForTimeout(1500);console.log(await p.evaluate(()=>window.ok));
 await p.screenshot({path:'/tmp/gl.png'});await b.close();srv.kill();})();
