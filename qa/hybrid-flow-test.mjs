import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshWorkshop,setBasket,brushRim,turnShell,placePot,setHeat,tickWorkshop,pourCoffee} from '../workshop-state.mjs';
import {measureWater,measurePowder} from '../workshop-controls.mjs';
import {recipeFromWorkshop} from '../recipe-workshop-bridge.mjs';
import {setAmount,splitCup,mergeCups,undo,total,batchAvailable} from '../recipe-state.mjs';
import {fillHeight} from '../cup-geometry.mjs';
import {MOKA_DIMENSIONS} from '../moka-diagram.mjs';
const geometry=JSON.parse(fs.readFileSync(new URL('../assets/hybrid/geometry.json',import.meta.url)));
assert.equal(geometry.upper.topRadius,MOKA_DIMENSIONS.upperRadius);
assert.equal(geometry.lower.bottomRadius,MOKA_DIMENSIONS.lowerRadius);
assert.ok(geometry.upper.topRadius>geometry.lower.bottomRadius*1.2);
assert.ok(geometry.joint.collarInnerRadius>geometry.joint.neckOuterRadius);
assert.equal(geometry.joint.sealTop,geometry.joint.sealSeatHeight);
geometry.explodedGaps.forEach(g=>assert.ok(g.gap>.025));
// The initial 70% view must actually reveal the filter below the collector collar.
assert.ok(geometry.components.upper.min[2]+geometry.offsets.upper*.7>
 geometry.components.filter.max[2]+geometry.offsets.filter*.7+.1);
const w=freshWorkshop();w.open=1;measureWater(w,120);measurePowder(w,18);setBasket(w,true);brushRim(w,1000);
assert.equal(turnShell(w,-1),'');assert.equal(placePot(w,true),'');assert.equal(setHeat(w,2),'');
// Structure inspection has no separate modal pause; time proceeds with the desk.
for(let i=0;i<140;i++)tickWorkshop(w,.1);assert.ok(w.brewed>5);
const first=w.brewed;for(let i=0;i<100;i++)tickWorkshop(w,.1);assert.ok(w.brewed>=first);
setHeat(w,0);placePot(w,false);w.residual=0;pourCoffee(w,1000,1);
const s=recipeFromWorkshop(w,{session:'hybrid-qa'});setAmount(s,'coffee',40,{remember:false});
const beforeStock=batchAvailable(s);setAmount(s,'milk',80);const before=structuredClone(s.cups[0]);splitCup(s);assert.equal(total(s.cups[0])+total(s.cups[1]),total(before));
assert.equal(batchAvailable(s),beforeStock);assert.equal(mergeCups(s),'');assert.deepEqual(s.cups[0].amounts,before.amounts);assert.deepEqual(s.cups[0].allocations,before.allocations);
undo(s);assert.equal(s.cups.length,2);setAmount(s,'milk',300);s.selected='A';setAmount(s,'water',300);const retained=structuredClone(s.cups);assert.ok(mergeCups(s));assert.deepEqual(s.cups,retained);
assert.equal(fillHeight(0),0);assert.equal(fillHeight(360),302);for(let i=1;i<=360;i++)assert.ok(fillHeight(i)>fillHeight(i-1));
assert.ok(fillHeight(180)>151); // widening vessel: half volume is above half height.
console.log('PASS: shared 2D/3D profile, broad upper vessel, metal joint clearance, seated seal, exploded gaps, concurrent brewing, conserved split/merge/undo and tapered glass levels.');
