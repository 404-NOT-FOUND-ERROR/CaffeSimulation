import assert from 'node:assert/strict';
import {simulate,outputAt,blend,sanitizeSettings} from '../model.mjs';
let runs=0;
for(const grind of [0,1,2])for(const heat of [1,2,3])for(const water of [110,130,150])for(const fault of ['none','seal','fine']){
 const sim=simulate({grind,heat,water,fault});
 let lastMass=0,lastSolutes=0;
 for(const sample of sim.samples){assert(sample.mass>=lastMass-1e-9);assert(sample.solutes>=lastSolutes-1e-9);assert(sample.solutes<=sample.mass+1e-9);assert(Object.values(sample).every(Number.isFinite));lastMass=sample.mass;lastSolutes=sample.solutes;}
 const base=outputAt(sim,1);assert(Math.abs(base.mass-sim.yieldMass)<1e-8);assert(Math.abs(base.solutes-sim.targetSolutes)<1e-8);assert.equal(outputAt(sim,0).concentration,0);
 for(const type of ['black','milk','long'])for(const ratio of [0,.1,1,2,3]){const d=blend(base,type,ratio);assert.equal(d.solutes,base.solutes);assert(Math.abs(d.totalMass-d.coffeeMass-d.addedMass)<1e-8);assert(d.coffeeSoluteConcentration<=base.concentration+1e-8);assert(d.coffeeFraction>=0&&d.coffeeFraction<=1);}
 runs++;
}
assert.deepEqual(sanitizeSettings({grind:100,heat:9,water:1,fault:'bad'}),{grind:2,heat:3,water:110,fault:'none'});
console.log(`PASS: ${runs} brewing scenarios; monotonic accumulation, conservation, empty output and dilution invariants.`);
