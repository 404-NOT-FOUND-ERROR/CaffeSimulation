import assert from 'node:assert/strict';
import {GEARS,ORDERS,newProcess,tick,makeCup,cupFacts,checkOrder,makeReport,sanitizeCup} from '../studio-model.mjs';
let count=0;
for(const grind of [0,1,2])for(const speed of [0,1,2]){
 const s={...GEARS.pour.defaults,grind,speed},p=newProcess('pour',s);p.status='running';p.holding=true;p.pours=1;p.zones[0]=1;
 let previous=0;for(let i=0;i<3000&&p.status==='running';i++){tick(p,s,.05);assert(p.mass>=previous);previous=p.mass;assert(Math.abs(p.poured-p.retained-p.bedWater-p.mass-p.spill)<1e-7,'water balance');}
 assert.equal(p.status,'done');const c=makeCup(p,1),solutes=c.solutes;c.milk=80;c.water=50;c.ice=30;c.foam=5;assert.equal(c.solutes,solutes);assert.equal(cupFacts(c).total,c.baseMass+165);assert.deepEqual(sanitizeCup(c),c);count++;
}
const s={...GEARS.espresso.defaults},p=newProcess('espresso',s);p.status='running';for(let i=0;i<100;i++)tick(p,s,.05);const c=makeCup(p,1);
assert(checkOrder(c,ORDERS.find(o=>o.id==='bar')).met);c.milk=100;assert(!checkOrder(c,ORDERS.find(o=>o.id==='bar')).met);assert(makeReport(c,ORDERS.find(o=>o.id==='bar')).intro.includes('还有这些要求'));
const snapshot=JSON.stringify(c);makeReport(c,null);assert.equal(JSON.stringify(c),snapshot);
console.log(`PASS: ${count} pouring combinations conserve water, recipe additives conserve solutes, recipe sanitization, order requirements and report facts.`);
