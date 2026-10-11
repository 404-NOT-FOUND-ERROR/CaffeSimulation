import {KEYS,INGREDIENTS,total,compare} from './recipe-state.mjs';
import {cupSVG,glassMaterialData} from './recipe-art.js';
export const PALETTES=[
 {name:'赤陶红',paper:'#f7efdf',ink:'#30241c',accent:'#b4522d',other:'#294955'},
 {name:'意式蓝',paper:'#f9f2df',ink:'#203b49',accent:'#284c68',other:'#c9893c'},
 {name:'橄榄绿',paper:'#f5eedc',ink:'#28372d',accent:'#657454',other:'#b45734'},
 {name:'柠檬黄',paper:'#fff5d8',ink:'#283d47',accent:'#d4a737',other:'#38677b'},
 {name:'咖啡棕',paper:'#f2e8d5',ink:'#322419',accent:'#765039',other:'#afbbb0'},
 {name:'珊瑚粉',paper:'#f8f0e7',ink:'#343a40',accent:'#d58878',other:'#304c61'}
];
const imageCache=new Map();
function loadImage(src){if(!imageCache.has(src))imageCache.set(src,new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('图片加载失败'));i.src=src;}));return imageCache.get(src);}
const font='"Microsoft YaHei","PingFang SC",sans-serif';
function text(ctx,s,x,y,size,{color='#30241c',weight='normal',family=font,align='left',max=undefined}={}){ctx.fillStyle=color;ctx.font=weight+' '+size+'px '+family;ctx.textAlign=align;max?ctx.fillText(s,x,y,max):ctx.fillText(s,x,y);}
function condensed(ctx,s,x,y,width,size,color){ctx.save();ctx.textAlign='left';ctx.font='italic 900 '+size+'px Impact,"Arial Black",sans-serif';const measured=ctx.measureText(s).width;ctx.translate(x,y);ctx.scale(width/measured,1);ctx.fillStyle=color;ctx.fillText(s,0,0);ctx.restore();}
function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function drink(ctx,image,x,y,width){ctx.drawImage(image,x,y,width,width*image.naturalHeight/image.naturalWidth);}
function rule(ctx,y,p){ctx.strokeStyle=p.ink;ctx.globalAlpha=.3;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(1120,y);ctx.stroke();ctx.globalAlpha=1;}
function grain(ctx){let seed=1297;ctx.fillStyle='#70532e';for(let i=0;i<9000;i++){seed=seed*16807%2147483647;const x=seed%1200;seed=seed*16807%2147483647;ctx.globalAlpha=seed%5/220;ctx.fillRect(x,seed%1800,1,1);}ctx.globalAlpha=1;}
export const recipeLine=c=>KEYS.filter(k=>c.amounts[k]>0).map(k=>(k==='coffee'?'摩卡':INGREDIENTS[k].name)+' '+c.amounts[k]+'g').join(' + ');
export function sourceLine(s,cups=s.cups){const ids=[...new Set(cups.flatMap(c=>Object.keys(c.allocations)))];return ids.map(id=>s.batches.find(b=>b.id===id)?.name||'摩卡基底').join(' / ');}
export function editionTitle(s){return s.poster.title||(s.poster.layout==='double'&&s.cups.length===2?(compare(s).sameBatch?'一份咖啡，两种可能':'两杯咖啡，各有来处'):(s.cups.find(c=>c.id===s.selected)||s.cups[0]).name);}

const tintCache=new Map();
const channels=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
async function illustratedPlate(style,p){
 const src='assets/gazette-v2/'+(style===1?'person':'coast')+'.png',key=src+p.accent;
 if(tintCache.has(key))return tintCache.get(key);
 const image=await loadImage(src),plate=document.createElement('canvas');plate.width=image.naturalWidth;plate.height=image.naturalHeight;
 const cx=plate.getContext('2d');cx.drawImage(image,0,0);
 if(p!==PALETTES[0]){
  const data=cx.getImageData(0,0,plate.width,plate.height),v=data.data,accent=channels(p.accent),other=channels(p.other);
  for(let i=0;i<v.length;i+=4){
   const [r,g,b]=[v[i],v[i+1],v[i+2]];
   // Re-ink the lithographic plates while preserving their paper and print grain.
   const rust=r>g*1.27&&g>b*1.10&&r>100,blue=b>r*1.12&&g>r*1.06&&r<145;
   if(!rust&&!blue)continue;
   const color=rust?accent:other,shade=rust?(.28*r+.58*g+.14*b)/123:(.28*r+.58*g+.14*b)/58;
   const strength=rust?Math.min(1,(r-g)/40):Math.min(1,(b-r)/25);
   for(let ch=0;ch<3;ch++)v[i+ch]=Math.round(v[i+ch]*(1-strength)+Math.min(255,color[ch]*shade)*strength);
  }
  cx.putImageData(data,0,0);
 }
 tintCache.set(key,plate);return plate;
}
function recipeFooter(ctx,cups,p,y=1550){
 const double=cups.length===2;
 cups.forEach((c,i)=>{
  const items=KEYS.filter(k=>c.amounts[k]>0).map(k=>(k==='coffee'?'摩卡咖啡液':INGREDIENTS[k].short)+' '+c.amounts[k]+' g');
  const rows=double?[items.join(' · ')]:items.length>3?[items.slice(0,3).join(' · '),items.slice(3).join(' · ')]:[items.join(' · ')];
  rows.forEach((r,j)=>text(ctx,(double?c.id+' / ':'')+r,600,y+i*43+j*38,26,{color:p.paper,align:'center',max:1020}));
 });
 text(ctx,cups.map(c=>(double?c.id+' ':'')+total(c)+' g').join('  ·  '),600,1694,32,{color:p.paper,align:'center'});
 text(ctx,'本次用摩卡壶制作',600,1750,25,{color:p.paper,align:'center'});
}
export async function drawGazette(canvas,s,{style=s.poster.style}={}){
 const p=PALETTES[s.poster.palette]||PALETTES[0],ctx=canvas.getContext('2d');
 const cups=s.poster.layout==='double'&&s.cups.length===2?s.cups:[s.cups.find(c=>c.id===s.selected)||s.cups[0]],double=cups.length===2,title=editionTitle(s),view=s.poster.layout==='recipe'?'recipe':'finished';
 let glassMaterial='';try{glassMaterial=await glassMaterialData();}catch{}
 const images=await Promise.all(cups.map(c=>loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(cupSVG(c,view,{labels:false,glassMaterial,fluted:true}).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="702" height="840" ')))));
 const plate=await illustratedPlate(style,p);
 ctx.save();ctx.scale(canvas.width/1200,canvas.height/1800);ctx.clearRect(0,0,1200,1800);ctx.fillStyle=p.paper;ctx.fillRect(0,0,1200,1800);
 if(style===0){
  ctx.drawImage(plate,0,0,1200,1800);
  ctx.save();ctx.translate(72,512);ctx.rotate(-.16);condensed(ctx,'CAFFÈ',0,0,1020,350,p.paper);ctx.restore();
  ctx.save();ctx.translate(68,705);ctx.rotate(-.16);condensed(ctx,double?'FATTO PER DUE':'FATTO DA ME',0,0,1040,218,p.other);ctx.restore();
  ['Un','Piccolo','Piacere','Grande','Ogni Giorno'].forEach((l,i)=>text(ctx,l,939,635+i*39,26,{color:p.paper,family:'Georgia'}));
  ['BUON','CAFFÈ','UNA VITA','PIÙ BELLA'].forEach((l,i)=>text(ctx,l,90,882+i*35,22,{color:p.paper,family:'Georgia'}));
  if(double){drink(ctx,images[0],40,733,545);drink(ctx,images[1],593,733,545);}else drink(ctx,images[0],220,585,760);
  text(ctx,title,600,1495,68,{color:p.paper,weight:'bold',align:'center',max:1030});
  ctx.strokeStyle=p.paper;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(170,1530);ctx.lineTo(1030,1530);ctx.stroke();ctx.globalAlpha=1;
  recipeFooter(ctx,cups,p,1587);
 }else if(style===1){
  ctx.drawImage(plate,0,0,1200,1800);
  text(ctx,'L A   G A Z Z E T T A   D E L   C A F F È',600,69,20,{family:'Georgia',align:'center',color:p.ink});
  condensed(ctx,double?'DUE IDEE':'UNA BUONA',66,217,1068,178,p.ink);
  condensed(ctx,'GIORNATA',68,393,880,183,p.accent);
  if(double){drink(ctx,images[0],500,1045,325);drink(ctx,images[1],833,1045,325);}else drink(ctx,images[0],619,920,519);
  ctx.fillStyle=p.paper;ctx.fillRect(0,1455,1200,345);
  text(ctx,title,600,1521,58,{weight:'bold',align:'center',color:p.ink,max:1040});
  rule(ctx,1564,p);recipeFooter(ctx,cups,{...p,paper:p.ink},1615);
 }else{
  // The report uses native text and the real drink, printed on the same paper.
  ctx.globalAlpha=.075;ctx.drawImage(plate,0,0,1200,1800);ctx.globalAlpha=1;
  text(ctx,'LA GAZZETTA DEL CAFFÈ',600,63,20,{color:p.accent,align:'center',family:'Georgia'});
  text(ctx,'Il Mio Caffè',600,237,141,{color:p.ink,weight:'bold',align:'center',family:'Georgia'});
  rule(ctx,269,p);text(ctx,'EDIZIONE / '+String(s.ticket||1).padStart(2,'0'),75,304,18,{color:p.accent});text(ctx,'RICETTE, PICCOLI RITUALI & GRANDI IDEE',1120,304,17,{color:p.ink,align:'right',family:'Georgia'});rule(ctx,332,p);
  text(ctx,title,75,420,58,{weight:'bold',max:1060});
  text(ctx,double?'同一锅咖啡的两种做法':'一锅摩卡，调出自己的味道。',78,480,25,{color:p.accent});
  ctx.fillStyle=p.accent;ctx.globalAlpha=.10;ctx.fillRect(66,540,1068,633);ctx.globalAlpha=1;
  if(double){drink(ctx,images[0],95,545,489);drink(ctx,images[1],616,545,489);}else drink(ctx,images[0],295,511,610);
  rule(ctx,1206,p);
  const columns=double?cups:[cups[0],null];columns.forEach((c,i)=>{
   const x=i?657:80;text(ctx,c?(double?c.id+' / 配方':'配方档案'):'基底从哪里来？',x,1280,32,{weight:'bold',color:p.ink});
   if(c){KEYS.filter(k=>c.amounts[k]>0).forEach((k,j)=>{text(ctx,INGREDIENTS[k].name,x,1338+j*43,23,{color:p.ink});text(ctx,c.amounts[k]+' g',x+444,1338+j*43,23,{align:'right',family:'Georgia',color:p.ink});});}
   else{const batch=s.batches.find(b=>b.id===s.batchId);['摩卡壶 · '+(batch?.capacity||0)+' g 咖啡液','下壶用水 '+(batch?.record?.water||'—')+' g','粉篮装粉 '+(batch?.record?.powder||'—')+' g','压力差推动水穿过粉层。','加水或加奶，不会再次萃取。'].forEach((l,j)=>text(ctx,l,x,1338+j*46,22,{max:450,color:p.ink}));}
  });
  rule(ctx,1640,p);text(ctx,sourceLine(s,cups)+' · '+cups.map(c=>(double?c.id+' ':'')+total(c)+' g').join(' · '),600,1703,23,{align:'center',color:p.ink,max:1040});text(ctx,'PIÙ CAFFÈ · PIÙ IDEE',600,1760,22,{family:'Georgia',align:'center',color:p.accent});
 }
 ctx.restore();return canvas;
}
