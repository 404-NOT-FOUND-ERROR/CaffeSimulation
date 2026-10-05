import assert from 'node:assert/strict';
import {GEARS,sanitizeCup} from '../studio-model.mjs';
import {PREPARATION,newPreparation,advancePreparation,preparationReady,quickPreparation,taskAllowed,taskComplete} from '../studio-steps.mjs';
for(const [gear,g] of Object.entries(GEARS)){
 const p=newPreparation(),s={...g.defaults};assert(!preparationReady(gear,p,s));
 for(const task of PREPARATION[gear]){for(let i=0;i<300&&!taskComplete(p,task.id,s);i++)advancePreparation(gear,p,task.id,s,.05);assert(taskComplete(p,task.id,s));}
 assert(preparationReady(gear,p,s));assert(!p.quick);assert.equal(p.manual.length,3);
 const fast=quickPreparation(gear,newPreparation(),s);assert(preparationReady(gear,fast,s));assert(fast.quick);assert.equal(fast.manual.length,0);
}
assert(!taskAllowed('moka',newPreparation(),'assemble',GEARS.moka.defaults));assert(!taskAllowed('pour',newPreparation(),'rinse',GEARS.pour.defaults));assert(!taskAllowed('espresso',newPreparation(),'tamp',GEARS.espresso.defaults));
const cup={gear:'moka',baseMass:90,solutes:3,settings:GEARS.moka.defaults,preparation:{method:'manual',steps:3}};assert.deepEqual(sanitizeCup(cup).preparation,cup.preparation);
for(const method of ['quick','mixed']){cup.preparation={method,steps:method==='mixed'?2:0};assert.deepEqual(sanitizeCup(cup).preparation,cup.preparation);}
console.log('PASS: preparation dependencies, hold-to-fill targets, manual and quick preparation for three apparatus, preparation provenance in recipe replay.');
