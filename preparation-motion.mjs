import {clamp} from './workshop-state.mjs';

const smooth=x=>x*x*(3-2*x);

// One continuous path in both directions: release the thread, then park the upper pot.
// Closing follows the same path back, regardless of the current camera preset.
export function upperPotPose(open){
 const twist=clamp(open/.38,0,1),park=smooth(clamp((open-.38)/.62,0,1));
 return {x:park?-1.65*park:0,y:.10*twist-1.67*park,z:park?-2.0*park:0,rotation:twist*Math.PI*2};
}

export function sectionWaterAmount(y){return Math.round(clamp((222-y)/76*130,0,158));}

export function advanceMeasuredAmount(current,target,dt,rate){
 return current+Math.sign(target-current)*Math.min(Math.abs(target-current),Math.max(0,dt)*rate);
}
