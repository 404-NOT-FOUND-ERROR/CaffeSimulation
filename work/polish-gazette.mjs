import fs from 'node:fs';
const file='recipe-gazette.js',old=fs.readFileSync(file,'utf8');
fs.writeFileSync(file,old.slice(0,old.indexOf('export async function drawGazette'))+`
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
  ctx.save();ctx.translate(72,472);ctx.rotate(-.16);condensed(ctx,'CAFFÈ',0,0,1020,350,p.paper);ctx.restore();
  ctx.save();ctx.translate(68,705);ctx.rotate(-.16);condensed(ctx,double?'FATTO PER DUE':'FATTO DA ME',0,0,1040,218,p.other);ctx.restore();
  ['Un','Piccolo','Piacere','Grande','Ogni Giorno'].forEach((l,i)=>text(ctx,l,939,575+i*39,26,{color:p.paper,family:'Georgia'}));
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
`);
let art=fs.readFileSync('recipe-art.js','utf8').replace("iceDrops=[],glassMaterial=","iceDrops=[],fluted=false,glassMaterial=");
art=art.replace(" const reflections=",` const facets=fluted?Array.from({length:7},(_,i)=>{const x=139+i*20;return '<path d="M'+x+' 413L'+(x-4)+' 281Q'+(x+3)+' 260 '+(x+10)+' 281L'+(x+17)+' 414" fill="none" stroke="#fff9e9" stroke-opacity=".3" stroke-width="1.25"/><path d="M'+(x+2)+' 410L'+(x-1)+' 290Q'+(x+3)+' 277 '+(x+6)+' 288L'+(x+9)+' 415" fill="#fff9e9" opacity=".065"/>';}).join(''):'';
 const reflections=facets+`);
fs.writeFileSync('recipe-art.js',art);
let mix=fs.readFileSync('recipe-mix-art.mjs','utf8').replace('angle=-14+','angle=14+');fs.writeFileSync('recipe-mix-art.mjs',mix);
fs.appendFileSync('reference-fidelity.css',`\n/* Keep six live ingredients on the recipe slip without an internal scrollbar. */
.lab .recipe-amounts:has(.amount-row:nth-child(5)){gap:8px;max-height:none;overflow:visible}
.lab .recipe-amounts:has(.amount-row:nth-child(5)) .amount-row{font-size:clamp(10px,.98vw,16px);min-height:23px}
.lab .recipe-amounts:has(.amount-row:nth-child(5)) .amount-row i{width:23px;height:23px}
@media(orientation:landscape) and (max-height:520px){.lab .recipe-amounts:has(.amount-row:nth-child(5)){gap:3px}.lab .recipe-amounts:has(.amount-row:nth-child(5)) .amount-row{font-size:9px;min-height:14px}.lab .recipe-amounts:has(.amount-row:nth-child(5)) .amount-row i{width:13px;height:13px}}
`);
