import assert from 'node:assert/strict';
import {upperPotPose,sectionWaterAmount,advanceMeasuredAmount} from '../preparation-motion.mjs';

// A reversed close must follow exactly the opening path, without a camera-mode teleport.
const closed=upperPotPose(0),parked=upperPotPose(1);
assert.deepEqual(closed,{x:0,y:0,z:0,rotation:0});assert.equal(parked.x,-1.65);assert.equal(parked.z,-2);
let previous=closed;
for(let i=1;i<=1000;i++){const next=upperPotPose(i/1000);assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y,next.z-previous.z)<.02);previous=next;}
assert.equal(sectionWaterAmount(222),0);assert.equal(sectionWaterAmount(146),130);assert.equal(sectionWaterAmount(50),158);assert.equal(sectionWaterAmount(300),0);
assert.equal(advanceMeasuredAmount(119,120,.08,80),120);assert.equal(advanceMeasuredAmount(150,120,.08,80),143.6);
console.log('PASS: continuous pot path, reverse path, bounded section coordinates and non-overshooting measured fills');
