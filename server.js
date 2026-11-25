// Serve the static build through one shared admission counter.
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
const root=resolve('out');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.txt':'text/plain','.woff2':'font/woff2','.ico':'image/x-icon','.svg':'image/svg+xml','.webp':'image/webp'};
let active=0;
createServer(async(req,res)=>{
  if(active>=1500){res.writeHead(503,{'Retry-After':'1','Connection':'close'}).end();return}
  active++;
  res.once('close',()=>{active--});
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=resolve(root,'.'+path);
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return}
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const info=await stat(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':info.size,'X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD'){res.end();return}
    const stream=createReadStream(file);
    res.once('close',()=>stream.destroy());
    stream.on('error',()=>res.destroy()).pipe(res);
  }catch{if(!res.headersSent)res.writeHead(404);res.end()}
}).listen(Number(process.env.PORT??3000));
