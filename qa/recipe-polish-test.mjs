import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshRecipe,activeCup,total,setAmount,checkpoint,undo,CAPACITY,cupAppearance} from '../recipe-state.mjs';
import {ICE_MASS,iceFits,pourMarkup,solidIceMarkup,fallingIceMarkup} from '../recipe-dispense-art.mjs';
import {cupSVG} from '../recipe-art.js';
import {mixingMarkup,spoonMarkup} from '../recipe-mix-art.mjs';
const s=freshRecipe(),c=activeCup(s),original=structuredClone(c.amounts),color=cupAppearance(c).color;
checkpoint(s);
for(let i=0;i<3;i++){assert.ok(iceFits(c));setAmount(s,'ice',c.amounts.ice+ICE_MASS,{remember:false});}
assert.equal(c.amounts.ice,45);assert.equal(cupAppearance(c).color,color,'Solid ice must not whiten the liquid');
assert.ok(undo(s));assert.deepEqual(activeCup(s).amounts,original,'A held ice gesture is one reversible operation');
const nearFull=freshRecipe();setAmount(nearFull,'milk',CAPACITY-40-10-14);
assert.equal(CAPACITY-total(activeCup(nearFull)),14);assert.equal(iceFits(activeCup(nearFull)),false,'Refuse an entire cube instead of silently pouring fractional ice');
setAmount(s,'ice',45);
const drink=activeCup(s);
for(const k of ['coffee','water','milk','foam','syrup'])for(const elapsed of [0,.1,.3,1,5]){
 const art=pourMarkup(drink,{ingredient:k,elapsed});assert.ok(!/NaN|Infinity|undefined/.test(art));assert.ok(!art.includes('scale(1 .62)'),'Dispensing assets preserve their aspect ratio');
}
assert.equal(pourMarkup(drink,{ingredient:'ice',elapsed:1}),'','Ice never uses a liquid stream');
for(const progress of [0,.15,.4,.7,1]){
 assert.ok(!mixingMarkup(drink,'recipe',progress).includes('data-mix-ingredient="ice"'));
 assert.ok(!/NaN|Infinity/.test(spoonMarkup(drink,progress)));
}
const drops=[{index:2,seed:1,elapsed:.25}];
assert.equal((solidIceMarkup(drink,drops).match(/class="ice-cube"/g)||[]).length,2,'A falling cube is not duplicated at the liquid surface');
assert.equal((fallingIceMarkup(drink,drops).match(/class="ice-cube"/g)||[]).length,1);
for(const elapsed of [0,.25,.51,.52,.7,.94])assert.ok(!/NaN|Infinity/.test(fallingIceMarkup(drink,[{...drops[0],elapsed}])));
const svg=cupSVG(drink,'recipe',{labels:false,utensil:true,pouring:{ingredient:'milk',elapsed:.6},iceDrops:drops});
assert.ok(!svg.includes('fill="#cbdbe0"'),'No fake blue liquid band for ice');
const glb=fs.readFileSync(new URL('../assets/hybrid/moka-v1.glb',import.meta.url)),json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
assert.ok(json.meshes.every(m=>m.primitives.every(p=>p.attributes.COLOR_0!==undefined)),'Every live mesh retains baked cavity colors');
console.log('PASS: discrete ice, capacity refusal, one-gesture undo, solid/liquid separation, finite animation geometry, undistorted overlays and exported cavity colors.');
