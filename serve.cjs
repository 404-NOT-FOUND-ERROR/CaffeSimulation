const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const root=__dirname,port=Number(process.env.PORT||4186);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
http.createServer((req,res)=>{let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 // Local preview support: keep a reviewable HTTP PNG when a browser cannot save blob URLs.
 // Only the same-origin page can write, with a fixed output directory and bounded PNG dimensions.
 if(rel==='/api/export-poster'&&req.method==='POST'){
  if(!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)||req.headers['content-type']!=='image/png'){json(res,403,{error:'Invalid export request'});return;}
  const chunks=[];let size=0,rejected=false;
  req.on('data',chunk=>{size+=chunk.length;if(size>6*1024*1024){if(!rejected)json(res,413,{error:'Image too large'});rejected=true;chunks.length=0;}else if(!rejected)chunks.push(chunk);});
  req.on('end',()=>{if(rejected)return;const data=Buffer.concat(chunks);if(data.length<33||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.readUInt32BE(16)!==1200||data.readUInt32BE(20)!==1800){json(res,400,{error:'Invalid poster PNG'});return;}
   const directory=path.join(root,'exports'),name='moka-'+randomUUID()+'.png';fs.mkdir(directory,{recursive:true},error=>{if(error){json(res,500,{error:'Cannot save image'});return;}fs.writeFile(path.join(directory,name),data,error=>error?json(res,500,{error:'Cannot save image'}):json(res,201,{url:'/exports/'+name}));});
  });return;
 }
 const file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));const safe=path.relative(root,file);if(safe.startsWith('..')||path.isAbsolute(safe)){res.writeHead(403).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)})}).listen(port,'127.0.0.1',()=>console.log(`Moka lab: http://127.0.0.1:${port}`));
