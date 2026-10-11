import assert from 'node:assert/strict';
import {transformedPoint,liquidPath} from '../poster-motion.mjs';
// Every view uses the renderer's actual spout anchor, even while tilting/scaling.
const spout=[.188878,.220925];
assert.deepEqual(transformedPoint([.5,.8],{rotation:-42,scale:.72,x:18}),[652.8,960]);
const stationary=transformedPoint(spout),tilted=transformedPoint(spout,{x:18,rotation:-40.6});
assert.ok(tilted[1]>stationary[1],'Tilting lowers the lip toward the receiving cup');
for(const scale of [.65,.72,1])for(const rotation of [0,-40.6]){
 const point=transformedPoint(spout,{x:18,scale,rotation});
 assert.ok(point.every(Number.isFinite));assert.ok(liquidPath(point,[240,1060]).endsWith('240 1060'));
}
assert.equal(liquidPath([300,900],[200,700]),'','No stream can travel upward to a cup');
assert.equal(liquidPath([NaN,300],[200,900]),'');
console.log('poster motion: projected anchors and gravity path passed');
