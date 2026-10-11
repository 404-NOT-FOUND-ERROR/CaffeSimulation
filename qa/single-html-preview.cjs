// Deliberately serve only the packaged HTML; missing sidecar assets cannot be masked.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../dist/caffe-simulation.html');
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname!=='/index.html'&&pathname!=='/'){res.writeHead(404).end('Single HTML preview: no sidecar files');console.log('MISSING '+pathname);return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);console.log('HTML '+req.url);
}).listen(4187,'127.0.0.1',()=>console.log('Single HTML preview: http://127.0.0.1:4187/index.html'));
