import fs from 'node:fs';
function edit(file,fn){let s=fs.readFileSync(file,'utf8');fs.writeFileSync(file,fn(s));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing: '+a.slice(0,100));return s.replace(a,b);}
edit('recipe-art.js',s=>{
 const start=s.indexOf(' const stream=pouring');
 const end=s.indexOf('\n const markup=',start);
 s=s.slice(0,start)+` const stream=pourMarkup(c,pouring);
 const solids=solidIceMarkup(c,iceDrops),falling=fallingIceMarkup(c,iceDrops);
 const spoon=mix?spoonMarkup(c,mix.progress):utensil?spoonMarkup(c,0,true):'';
 const overlays='<defs><clipPath id="solid-clip-'+c.id+'"><path d="'+clip+'" transform="scale(1 .62)"/></clipPath></defs>'+spoon+'<g clip-path="url(#solid-clip-'+c.id+')">'+solids+'</g>'+falling+stream;
`+s.slice(end);
 s=replace(s,"+annotations+(mix?spoonMarkup(c,mix.progress):utensil?spoonMarkup(c,0,true):'')+stream+'</svg>'","+annotations+'</svg>'");
 s=replace(s,".replace(/<\\/svg>$/,'</g></svg>')",".replace(/<\\/svg>$/,'</g>'+overlays+'</svg>')");
 return s;
});
edit('recipe-lab.js',s=>{
 s="import {ICE_MASS,ICE_INTERVAL,ICE_LIFETIME,iceFits} from './recipe-dispense-art.mjs';\n"+s;
 s=replace(s,'hold=null,mixing=null,','hold=null,dispensing=null,iceDrops=[],iceSerial=0,mixing=null,');
 s=replace(s,"pouring:c.id===state.selected?(hold?.started?hold.ingredient:null):null,mix:","pouring:dispensing?.cupId===c.id?dispensing:null,iceDrops:iceDrops.filter(d=>d.cupId===c.id),mix:");
 s=replace(s,"pouring:(hold?.started?hold.ingredient:null),mix:","pouring:dispensing?.cupId===c.id?dispensing:null,iceDrops:iceDrops.filter(d=>d.cupId===c.id),mix:");
 s=replace(s,"+'，按住持续添加\" aria-pressed=", "+(k==='ice'?'，点击投入一块15克冰':'，按住持续添加')+'\" aria-pressed=");
 const a=s.indexOf('function renderIngredientAdjust()'),b=s.indexOf('\nfunction renderRecipe()',a);
 s=s.slice(0,a)+`function renderIngredientAdjust(){
 const k=selectedIngredient,host=$('ingredientAdjust');if(!host)return;
 const step=k==='ice'?ICE_MASS:5;$('ingredientTray').style.setProperty('--selected-index',KEYS.indexOf(k));
 host.innerHTML='<div class="ingredient-adjust"><strong>'+INGREDIENTS[k].short+' <span id="selectedAmount">'+mass(cup().amounts[k])+' g</span></strong><button data-adjust="-'+step+'" aria-label="减少'+INGREDIENTS[k].short+step+'克">−</button><input data-amount="'+k+'" type="number" min="0" max="'+CAPACITY+'" step="'+(k==='ice'?ICE_MASS:1)+'" value="'+mass(cup().amounts[k])+'" aria-label="托盘'+INGREDIENTS[k].short+'用量"><button data-adjust="'+step+'" aria-label="增加'+INGREDIENTS[k].short+step+'克">+</button><small>'+(k==='ice'?'点击投入一块 · 每块 15 g':'按住添加 · 松手停止')+'</small></div>';
}
`+s.slice(b);
 s=replace(s,"const el=document.querySelector('.recipe-total strong');if(el)el.textContent=mass(total(cup()))+' g';}\n else renderRecipeDetails();", "}\n renderRecipeDetails();");
 s=replace(s,"if(pointer!==null)try{element.setPointerCapture(pointer);}catch{}renderIngredientAdjust();refreshAmounts();", "if(pointer!==null)try{element.setPointerCapture(pointer);}catch{}\n if(ingredient==='ice'){checkpoint(state);hold.started=true;hold.nextIce=ICE_INTERVAL;addIceCube(false);}\n renderIngredientAdjust();refreshAmounts();");
 s=replace(s,'// A tap selects a material. Only a deliberate hold starts the pour.','// Liquids require a hold; a tap drops exactly one solid cube.\n if(dispensing)dispensing.release=0;');
 s=replace(s,'function stopHold(){',`function addIceCube(remember=true){
 if(!iceFits(cup())){toast('杯里放不下一整块冰了。可先减少其他材料。');return false;}
 const result=setAmount(state,'ice',cup().amounts.ice+ICE_MASS,{remember});
 if(result.changed>0){
  if(hold)hold.amount+=result.changed;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)iceDrops.push({cupId:cup().id,elapsed:0,seed:++iceSerial});
 }
 return result.changed>0;
}
function stopHold(){`);
 s=replace(s,"if(b.dataset.adjust){finishMix();const result=", "if(b.dataset.adjust){finishMix();if(selectedIngredient==='ice'&&Number(b.dataset.adjust)>0){addIceCube();render();save();return;}const result=");
 s=replace(s,"if(action==='undo'){if(undo(state))", "if(action==='undo'){iceDrops=[];dispensing=null;if(undo(state))");
 const tickStart=s.indexOf(' if(!document.hidden&&hold){hold.elapsed'),tickEnd=s.indexOf('\n const old=',tickStart);
 s=s.slice(0,tickStart)+` if(!document.hidden&&hold){
  hold.elapsed+=dt;
  if(hold.ingredient==='ice'){
   if(hold.elapsed>=hold.nextIce){hold.nextIce+=ICE_INTERVAL;if(!addIceCube(false))stopHold();}
  }else if(hold.elapsed>.25){
   if(!hold.started){checkpoint(state);hold.started=true;dispensing={ingredient:hold.ingredient,cupId:hold.cupId,elapsed:0};}
   const target=hold.startAmount+INGREDIENTS[hold.ingredient].rate*(hold.elapsed-.25);
   const result=setAmount(state,hold.ingredient,target,{remember:false});hold.amount+=result.changed;
   if(result.message){toast(result.message);if(result.changed===0)stopHold();}
  }
 }
 let endedMotion=false;
 if(!document.hidden){
  if(dispensing){dispensing.elapsed+=dt;if(dispensing.release!==undefined){dispensing.release+=dt;if(dispensing.release>.34){dispensing=null;endedMotion=true;}}}
  iceDrops.forEach(d=>d.elapsed+=dt);
  if(iceDrops.some(d=>d.elapsed>=ICE_LIFETIME))endedMotion=true;
  iceDrops=iceDrops.filter(d=>d.elapsed<ICE_LIFETIME);
 }
`+s.slice(tickEnd);
 s=replace(s,"if(now-lastPaint>(mixing?30:95)){if(mixing)updateRecipeHero();else if(hold)refreshAmounts();else if(scene==='brewing'&&!transitioning)paintBrew();lastPaint=now;}","if(now-lastPaint>((mixing||dispensing||iceDrops.length)?30:95)||endedMotion){if(['recipe','compare'].includes(scene)){if(hold)refreshAmounts();else if(mixing||dispensing||iceDrops.length||endedMotion)updateRecipeHero();}else if(scene==='brewing'&&!transitioning)paintBrew();lastPaint=now;}");
 return s;
});
