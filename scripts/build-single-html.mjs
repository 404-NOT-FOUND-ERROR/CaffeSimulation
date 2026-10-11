import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let esbuild;
try { esbuild=require('esbuild'); }
catch {
  if(!process.env.COFFEE_BUILD_MODULES)throw new Error('Run npm install before building the single HTML.');
  esbuild=require(path.join(process.env.COFFEE_BUILD_MODULES,'esbuild'));
}
const destination=path.resolve(root,process.argv[2]||'dist/caffe-simulation.html');
const assets={},assetRecords=[];
const mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.json':'application/json','.woff2':'font/woff2'};
async function collect(directory){
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
    if(entry.name==='concepts')continue;
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())await collect(full);
    else if(mime[path.extname(full)]){
      const key=path.relative(root,full).replaceAll('\\','/'),data=await fs.readFile(full);
      assets[key]=`data:${mime[path.extname(full)]};base64,${data.toString('base64')}`;
      assetRecords.push({path:key,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
    }
  }
}
await collect(path.join(root,'assets'));
function cssAssets(css){
  return css.replace(/url\(\s*(['"]?)(assets\/[^'"\s)]+)\1\s*\)/g,(_,quote,key)=>{
    if(!assets[key])throw new Error(`Missing CSS asset: ${key}`);
    return `url("${key}")`;
  });
}
const pages={};
for(const [screen,filename] of Object.entries({studio:'studio.html',brew:'moka-brew.html',mix:'moka.html'})){
  const html=await fs.readFile(path.join(root,filename),'utf8');
  const entry=html.match(/<script type="module" src="([^"]+)"><\/script>/)?.[1];
  if(!entry)throw new Error(`No entry script in ${filename}`);
  let css='';
  for(const [,href] of html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g))css+=cssAssets(await fs.readFile(path.join(root,href),'utf8'))+'\n';
  const result=await esbuild.build({
    absWorkingDir:root,entryPoints:[entry],bundle:true,write:false,format:'iife',platform:'browser',
    target:['chrome109','edge109'],minify:true,legalComments:'inline',metafile:true,
    plugins:[{name:'single-file-navigation',setup(build){
      build.onLoad({filter:/\.(m?js)$/},async args=>{
        let contents=await fs.readFile(args.path,'utf8');
        contents=contents.replace(/new URL\((['"])(studio|moka-brew|moka)\.html\1,\s*location\.href\)/g,(_,q,file)=>`window.__coffeeStandalone.url('${file}.html')`);
        // The remaining direct assignment is the workshop's return-to-studio link.
        if(path.basename(args.path)==='hybrid-workbench.js')contents=contents.replace(/:'studio\.html'/g,":window.__coffeeStandalone.url('studio.html').href");
        if(path.basename(args.path)==='recipe-lab.js')contents=contents.replace("try{const res=await fetch('api/export-poster'","try{if(!window.__coffeeStandalone){const res=await fetch('api/export-poster'").replace("$('exportLink').hidden=false;}}catch{}","$('exportLink').hidden=false;}}}catch{}");
        return {contents,loader:'js'};
      });
    }}]
  });
  pages[screen]={
    title:html.match(/<title>([^<]+)<\/title>/)?.[1]||'咖啡小馆',css,
    body:html.match(/<body>([\s\S]*?)<\/body>/)?.[1].replace(/<script\b[\s\S]*?<\/script>/g,''),
    js:result.outputFiles[0].text
  };
}
const license=await fs.readFile(path.join(root,'vendor/THREE-LICENSE.txt'),'utf8');
// Embed only the runtime dependency closure, excluding historical renders and design references.
const requested=new Set(Object.values(pages).flatMap(page=>[...JSON.stringify(page).matchAll(/assets\/[A-Za-z0-9_./-]+/g)].map(match=>match[0])));
function requestedAsset(key){return [...requested].some(ref=>ref===key||(ref.endsWith('/')&&key.startsWith(ref)&&(!['assets/cafe/v3/','assets/poster-workbench/'].includes(ref)||key.endsWith('.webp'))));}
for(const key of Object.keys(assets))if(!requestedAsset(key))delete assets[key];
for(let i=assetRecords.length-1;i>=0;i--)if(!assets[assetRecords[i].path])assetRecords.splice(i,1);
const bootstrap=String.raw`
(()=>{
 'use strict';
 const pack=JSON.parse(document.getElementById('coffee-package').textContent);
 const names={'studio.html':'studio','index.html':'studio','moka-brew.html':'brew','moka.html':'mix'};
 const current=new URL(location.href),screen=current.searchParams.get('screen')||'studio';
 function key(input){const value=String(input);if(value.startsWith('assets/'))return value;const found=value.indexOf('/assets/');return found<0?null:decodeURIComponent(value.slice(found+1).split(/[?#]/)[0]);}
 function asset(value){return pack.assets[key(value)]||value;}
 function route(file){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('screen',names[file]||'studio');return u;}
 function href(value){if(names[String(value)])return route(String(value)).href;return asset(value);}
 function markup(value){return String(value).replace(/\b(src|href)=(['"])([^'"]+)\2/g,(_,name,quote,value)=>name+'='+quote+(name==='href'?href(value):asset(value))+quote);}
 window.__coffeeStandalone={url:route,asset,version:pack.version};
 const fetchOriginal=window.fetch.bind(window);
 window.fetch=(input,options)=>{
  const value=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  const embedded=pack.assets[key(value)];
  if(embedded)return fetchOriginal(embedded);
  if(/^(data:|blob:)/.test(value))return fetchOriginal(input,options);
  return Promise.reject(new TypeError('The single HTML contains all runtime resources; network fetch is disabled.'));
 };
 const html=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 Object.defineProperty(Element.prototype,'innerHTML',{...html,set(value){html.set.call(this,markup(value));}});
 const adjacent=Element.prototype.insertAdjacentHTML;
 Element.prototype.insertAdjacentHTML=function(position,value){return adjacent.call(this,position,markup(value));};
 for(const [prototype,property,resolve] of [[HTMLImageElement.prototype,'src',asset],[HTMLAnchorElement.prototype,'href',href]]){
  const descriptor=Object.getOwnPropertyDescriptor(prototype,property);
  Object.defineProperty(prototype,property,{...descriptor,set(value){descriptor.set.call(this,resolve(value));}});
 }
 const setAttribute=Element.prototype.setAttribute;
 Element.prototype.setAttribute=function(name,value){return setAttribute.call(this,name,['src','href'].includes(name)?(name==='href'?href(value):asset(value)):value);};
 // file:// storage differs between browsers. Fall back only when native storage is denied.
 try{localStorage.setItem('__coffee_storage_probe','1');localStorage.removeItem('__coffee_storage_probe');}
 catch{const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)}});}
 const page=pack.pages[screen]||pack.pages.studio;
 document.title=page.title;
 const style=document.createElement('style');style.textContent=page.css.replace(/url\(\s*(['"]?)(assets\/[^'"\s)]+)\1\s*\)/g,(_,quote,value)=>'url("'+asset(value)+'")');document.head.append(style);
 document.body.innerHTML=page.body;
 const script=document.createElement('script');script.textContent=page.js;document.body.append(script);
})();
`;
const packageData=JSON.stringify({version:'2026-10-11',assets,pages,license}).replaceAll('<','\\u003c');
const output=`<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="咖啡小馆完整离线单文件：接单、摩卡冲煮、三维结构、自由调配、双杯实验和意式特刊。"><title>咖啡小馆 · 单文件版</title><style>body{margin:0;background:#f5eddf;color:#291b14}#loading{padding:8vh;font:18px sans-serif}</style></head><body><p id="loading">正在摆好咖啡小馆…</p><noscript>请启用 JavaScript。</noscript><script id="coffee-package" type="application/json">${packageData}</script><script>${bootstrap}</script></body></html>\n`;
await fs.mkdir(path.dirname(destination),{recursive:true});
await fs.writeFile(destination,output,'utf8');
const manifest={version:'2026-10-11',file:path.basename(destination),bytes:Buffer.byteLength(output),sha256:createHash('sha256').update(output).digest('hex'),screens:Object.keys(pages),assetCount:assetRecords.length,assets:assetRecords};
await fs.writeFile(path.join(path.dirname(destination),'single-html-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({file:destination,bytes:manifest.bytes,sha256:manifest.sha256,assets:assetRecords.length},null,2));
