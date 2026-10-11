import assert from 'node:assert/strict';
import {KEYS,CAPACITY,freshRecipe,activeCup,total,batchAvailable,batchUsed,setAmount,splitCup,undo,checkpoint,clearCup,prepIssue,startBrew,changeHeat,brewTick,collectBatch,newBrew,restore,snapshot,stirCup,useBatchInCup,cupAppearance,cupColor} from '../recipe-state.mjs';
const nearly=(a,b)=>assert.ok(Math.abs(a-b)<.11,a+' != '+b);
const sums=s=>Object.fromEntries(KEYS.map(k=>[k,s.cups.reduce((n,c)=>n+c.amounts[k],0)]));
const invariant=s=>{
 for(const c of s.cups){assert.ok(total(c)<=CAPACITY+.1);nearly(c.amounts.coffee,Object.values(c.allocations).reduce((n,x)=>n+x,0));}
 for(const b of s.batches){assert.ok(batchUsed(s,b.id)<=b.capacity+.1);nearly(batchAvailable(s,b.id)+batchUsed(s,b.id),b.capacity);}
};
const s=freshRecipe(),before=sums(s);assert.equal(total(activeCup(s)),130);
assert.equal(splitCup(s),'');for(const k of KEYS)nearly(sums(s)[k],before[k]);invariant(s);
setAmount(s,'milk',180);assert.equal(s.cups[0].amounts.milk,40);assert.equal(s.cups[1].amounts.milk,180);
assert.ok(undo(s));assert.equal(s.cups[1].amounts.milk,40);assert.ok(undo(s));assert.equal(s.cups.length,1);
setAmount(s,'coffee',999);assert.equal(activeCup(s).amounts.coffee,160);assert.equal(batchAvailable(s),0);invariant(s);
setAmount(s,'coffee',40);assert.equal(batchAvailable(s),120);clearCup(s);assert.equal(batchAvailable(s),160);undo(s);invariant(s);
checkpoint(s);for(let i=0;i<30;i++)setAmount(s,'water',activeCup(s).amounts.water+1,{remember:false});undo(s);assert.equal(activeCup(s).amounts.water,0);
setAmount(s,'milk',999);assert.equal(total(activeCup(s)),CAPACITY);invariant(s);
const brew=freshRecipe();brew.brew.water=145;brew.brew.powder=18;assert.ok(startBrew(brew));assert.equal(brew.brew.status,'prepare');
brew.brew.water=120;brew.brew.powder=0;assert.ok(prepIssue(brew.brew));brew.brew.powder=18;assert.equal(startBrew(brew),'');
for(let i=0;i<110;i++)brewTick(brew.brew,.1);const paused=structuredClone(brew.brew);brewTick(brew.brew,.1,{paused:true});assert.deepEqual(brew.brew,paused);
assert.ok(brew.brew.mass>5);changeHeat(brew.brew,0);const early=brew.brew.mass;for(let i=0;i<30;i++)brewTick(brew.brew,.1);assert.ok(brew.brew.mass>=early);
const batch=collectBatch(brew);assert.ok(batch.capacity<=120);assert.equal(collectBatch(brew),batch);assert.equal(brew.batches.length,2);
setAmount(brew,'coffee',90);assert.equal(batchUsed(brew,batch.id),50);invariant(brew);
const all=restore(snapshot(brew));invariant(all);assert.equal(all.brew.heat,0);assert.equal(all.brew.residual,0);
// Reloading during the pour animation preserves liquid, ready for one conserved transfer.
const interrupted=freshRecipe();interrupted.brew={...newBrew(),water:120,powder:18,mass:52.4,progress:.65,status:'collecting'};
const resumed=restore(snapshot(interrupted));assert.equal(resumed.brew.status,'ready');assert.equal(resumed.brew.heat,0);const recovered=collectBatch(resumed);assert.equal(recovered.capacity,52.4);assert.equal(collectBatch(resumed),recovered);invariant(resumed);
// Mixed batches and fractional grams must still conserve mass through a split and undo.
const mixed=freshRecipe();mixed.batches.push({id:'custom',name:'fractional',capacity:1,kind:'brewed'});mixed.batchId='custom';
setAmount(mixed,'coffee',.5);setAmount(mixed,'coffee',1);splitCup(mixed);invariant(mixed);undo(mixed);invariant(mixed);
// Restoring hostile or malformed quantities may not invent available coffee or exceed capacity.
const malformed=snapshot(brew);malformed.cups[0].amounts.milk=900;malformed.cups[0].amounts.coffee=999;malformed.cups[0].allocations[batch.id]=999;
invariant(restore(malformed));assert.equal(restore({version:3}),null);
brew.brew=newBrew();startBrew(brew);assert.equal(brew.brew.status,'prepare');
// Stirring changes presentation only. Ice remains solid, foam stays at the
// surface, and neither changes the computed underlying liquid color.
const paint=freshRecipe();clearCup(paint);setAmount(paint,'coffee',40);setAmount(paint,'water',80);
const black=cupColor(activeCup(paint));setAmount(paint,'ice',60);assert.equal(cupColor(activeCup(paint)),black);
setAmount(paint,'foam',20);assert.equal(cupColor(activeCup(paint)),black);
setAmount(paint,'milk',80);assert.notEqual(cupColor(activeCup(paint)),black);
const quantities=structuredClone(activeCup(paint).amounts),allocation=structuredClone(activeCup(paint).allocations);
assert.ok(stirCup(paint));assert.deepEqual(activeCup(paint).amounts,quantities);assert.deepEqual(activeCup(paint).allocations,allocation);assert.ok(undo(paint));assert.equal(activeCup(paint).stirred,false);
const onlyWater=freshRecipe();clearCup(onlyWater);setAmount(onlyWater,'water',100);assert.ok(cupAppearance(activeCup(onlyWater)).opacity<.5);
clearCup(onlyWater);setAmount(onlyWater,'ice',60);assert.equal(cupAppearance(activeCup(onlyWater)).opacity,0);
// A made batch can replace the example in one undoable action, without
// duplicating coffee, changing milk/water, or stealing another cup's stock.
const linked=freshRecipe();linked.brew={...newBrew(),powder:18,mass:98,progress:1,status:'ready'};
const own=collectBatch(linked),original=structuredClone(activeCup(linked));
assert.ok(useBatchInCup(linked,own.id).changed);assert.deepEqual(activeCup(linked).amounts,original.amounts);assert.deepEqual(activeCup(linked).allocations,{[own.id]:40});invariant(linked);
assert.equal(batchAvailable(linked,'example'),160);assert.equal(batchAvailable(linked,own.id),58);
assert.equal(useBatchInCup(linked,own.id).changed,false);undo(linked);assert.deepEqual(activeCup(linked),original);invariant(linked);
linked.batches.push({id:'too-small',name:'小批次',capacity:10,kind:'brewed'});assert.equal(useBatchInCup(linked,'too-small').changed,false);assert.deepEqual(activeCup(linked),original);
console.log('PASS: ingredient capacity, source conservation, independent cups, split/undo, one held gesture checkpoint, preparation guards, paused brew, carry-over, collect idempotence, mixed-source fractions, safe restore.');
console.log('PASS: liquid color excludes solid ice/foam, transparent water, stir mass conservation, made-base replacement and undo.');
