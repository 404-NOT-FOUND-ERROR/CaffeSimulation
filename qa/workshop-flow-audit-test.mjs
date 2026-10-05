import assert from 'node:assert/strict';
import {freshWorkshop,turnShell,setBasket,brushRim,placePot,setHeat,tickWorkshop,pourCoffee,cupSnapshot,restoreWorkshop,workshopReport,coffeeLeft} from '../workshop-state.mjs';
import {measureWater,measurePowder,reviseBlend} from '../workshop-controls.mjs';
function prepared(){const s=freshWorkshop();turnShell(s,1);measureWater(s,120);measurePowder(s,18);setBasket(s,true);brushRim(s,200);turnShell(s,-1);placePot(s,true);return s;}
const s=prepared();setHeat(s,1.6);for(let i=0;i<150;i++)tickWorkshop(s,.1);
const before=s.brewed;setHeat(s,0);const stopped=s.progress;
for(let i=0;i<10;i++)tickWorkshop(s,.1);assert.ok(s.brewed>before,'retained heat should continue a small amount of output');
const paused=structuredClone(s);for(let i=0;i<20;i++)tickWorkshop(s,.1,{paused:true});assert.deepEqual(s,paused);
const resumed=restoreWorkshop(s);assert.equal(resumed.heat,0);assert.equal(resumed.residual,0);assert.equal(resumed.stopProgress,stopped);
placePot(s,false);for(let i=0;i<80;i++)tickWorkshop(s,.1);assert.equal(s.residual,0);
const collected=s.brewed;pourCoffee(s,1000,1);assert.equal(coffeeLeft(s),0);assert.equal(s.poured,collected);
reviseBlend(s,'water',100);const snapshot=cupSnapshot(s);assert.ok(Math.abs(snapshot.record.heat-1.6)<1e-9);assert.equal(snapshot.preparation.method,'assisted');
const report=workshopReport(snapshot,null);assert.ok(report.observations.some(x=>x.includes('收杯')));assert.ok(report.observations.some(x=>x.includes('器具演示')));
const stable=structuredClone(snapshot);reviseBlend(s,'milk',100);assert.deepEqual(snapshot,stable);
// Changing fire changes duration continuously without causing output to jump backward.
const varied=prepared();setHeat(varied,.8);for(let i=0;i<120;i++)tickWorkshop(varied,.1);const a=varied.brewed;setHeat(varied,2.4);tickWorkshop(varied,.1);assert.ok(varied.brewed>=a);assert.ok(varied.brewed-a<3);assert.ok(varied.history.length>=2);
console.log('PASS: retained-heat output, reading pause, reload without flame, conserved transfer, actual heat record, truthful assisted preparation, immutable result and continuous fire changes');
