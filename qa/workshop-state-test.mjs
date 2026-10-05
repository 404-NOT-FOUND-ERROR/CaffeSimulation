import assert from 'node:assert/strict';
import {freshWorkshop,turnShell,waterFlow,setBasket,powderFlow,brushRim,placePot,setHeat,tickWorkshop,pourCoffee,addToCup,coffeeLeft,totalCup,cupSnapshot,workshopReport,restoreWorkshop,SPEC} from '../workshop-state.mjs';
const nearly=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

const s=freshWorkshop();assert.ok(waterFlow(s,20,1));assert.equal(s.water,0);
turnShell(s,1);waterFlow(s,148,1);assert.ok(setBasket(s,true));assert.ok(turnShell(s,-1));assert.equal(s.open,1);
waterFlow(s,-26,1);assert.equal(s.water,122);assert.ok(s.events.includes('water-corrected'));
// Filling the loose basket is valid; it is not a mandatory guided sequence.
powderFlow(s,18,1);assert.equal(s.powder,18);assert.equal(s.basketIn,false);
setBasket(s,true);assert.ok(turnShell(s,-1));brushRim(s,200);assert.equal(turnShell(s,-1),'');assert.equal(s.open,0);
assert.ok(setHeat(s,2));placePot(s,true);assert.equal(setHeat(s,2),'');
for(let i=0;i<200;i++)tickWorkshop(s,.1);
assert.ok(s.brewed>40);assert.ok(turnShell(s,1));assert.ok(placePot(s,false));
const before=structuredClone(s);for(let i=0;i<30;i++)tickWorkshop(s,.1,{paused:true});assert.deepEqual(s,before);
setHeat(s,0);const hot=s.temperature;tickWorkshop(s,.1);assert.ok(s.temperature>hot-.01);assert.ok(turnShell(s,1));
assert.equal(placePot(s,false),'');const earlyOutput=s.brewed;placePot(s,true);assert.equal(setHeat(s,1),'');tickWorkshop(s,.1);assert.ok(s.brewed>=earlyOutput);setHeat(s,0);placePot(s,false);const brewed=s.brewed;
pourCoffee(s,20,2);nearly(s.poured,40);nearly(coffeeLeft(s)+s.poured,brewed);
addToCup(s,'milk',75,2);const recipe=cupSnapshot(s);nearly(recipe.baseMass,40);nearly(recipe.milk,150);
const snapshot=structuredClone(recipe);addToCup(s,'water',20,1);assert.deepEqual(recipe,snapshot);
const report=workshopReport(recipe,null);assert.ok(report.observations.some(x=>x.includes('安全阀')));assert.ok(report.observations.some(x=>x.includes('壶缘')));
addToCup(s,'milk',1000,10);nearly(totalCup(s),SPEC.cupMax);const oldPour=s.poured;pourCoffee(s,1000,1);nearly(s.poured,oldPour);
s.lidOpen=.75;const restored=restoreWorkshop({...s,heat:3});assert.equal(restored.heat,0);assert.equal(restored.temperature,s.temperature);assert.equal(restored.lidOpen,.75);nearly(restored.poured,s.poured);
for(const grind of [0,1])for(const heat of [.7,1.5,2.5]){
 const p=freshWorkshop();turnShell(p,1);waterFlow(p,120,1);powderFlow(p,18,1);brushRim(p,200);setBasket(p,true);turnShell(p,-1);placePot(p,true);p.grind=grind;setHeat(p,heat);
 let previous=0;for(let i=0;i<1000;i++){tickWorkshop(p,.1);assert.ok(p.brewed>=previous);assert.ok(p.brewed<=p.water+1e-7);previous=p.brewed;}
 const lower=heat-.2;assert.ok(setHeat(p,lower));nearly(p.heat,lower);setHeat(p,0);assert.ok(setHeat(p,1));nearly(p.heat,0);placePot(p,false);pourCoffee(p,1000,10);nearly(coffeeLeft(p),0);nearly(p.poured,p.brewed);
}
console.log('PASS: preparation correction, loose basket, heat guards, pause snapshots, thermal persistence, coffee conservation, cup capacity, immutable reports, reload safety, six brewing combinations');
