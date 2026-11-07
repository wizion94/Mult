const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
exports.start=(port)=>new Promise(res=>{const s=http.createServer((q,r)=>{let p=path.join(__dirname,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';
 fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end();return}r.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');r.end(d)})}).listen(port,()=>res(s))});
