// Teaching model, not an experimentally calibrated thermo-fluid solver.
// All displayed brewing masses are model estimates, not real appliance advice.
export const DEFAULTS={grind:1,heat:2,water:130,fault:'none'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sanitizeSettings(s={}){return {grind:clamp(Math.round(Number(s.grind)||0),0,2),heat:clamp(Number(s.heat)||2,1,3),water:clamp(Number(s.water)||130,110,150),fault:['none','seal','fine'].includes(s.fault)?s.fault:'none'}}
export function simulate(input){
 const s=sanitizeSettings(input),dose=18,N=100,dt=1/N;
 const onset=.19-.035*(s.heat-2)+.045*(s.grind-1),end=.94;
 const yieldMass=s.water*.72*(s.fault==='seal'?.25:s.fault==='fine'?.38:1);
 const extraction=clamp([.168,.205,.195][s.grind]-.016*Math.max(0,s.heat-2),.08,.24)*(s.fault==='seal'?.35:s.fault==='fine'?.48:1);
 const targetSolutes=Math.min(dose*extraction,yieldMass*.11);
 const raw=[];let norm=0,soluteNorm=0;
 for(let i=0;i<=N;i++){const p=i/N,u=(p-onset)/(end-onset);let q=u>0&&u<1?Math.pow(Math.sin(Math.PI*u),.7):0;const rough=s.heat>2?1+.15*Math.sin(i*1.9):1;q*=rough;const c=Math.exp(-2*clamp(u,0,1));raw.push({p,q,c});if(i){norm+=(raw[i-1].q+q)*dt/2;soluteNorm+=(raw[i-1].q*raw[i-1].c+q*c)*dt/2}}
 let mass=0,solutes=0;const samples=raw.map((r,i)=>{if(i){mass+=(raw[i-1].q+r.q)*dt/2*yieldMass/norm;solutes+=(raw[i-1].q*raw[i-1].c+r.q*r.c)*dt/2*targetSolutes/soluteNorm}return {p:r.p,mass,solutes,flow:r.q*yieldMass/norm,pressure:(1-Math.exp(-r.p*5))*(.65+.16*s.heat)*(s.fault==='seal'?.18:1)}});
 return {settings:s,dose,samples,extraction,targetSolutes,yieldMass};
}
export function outputAt(sim,progress){const p=clamp(Number(progress)||0,0,1),index=p*(sim.samples.length-1),i=Math.floor(index),a=sim.samples[i],b=sim.samples[Math.min(i+1,sim.samples.length-1)],f=index-i;const mass=a.mass+(b.mass-a.mass)*f,solutes=a.solutes+(b.solutes-a.solutes)*f;return {mass,solutes,concentration:mass>.01?solutes/mass*100:0,extraction:solutes/sim.dose*100,flow:a.flow+(b.flow-a.flow)*f,pressure:a.pressure+(b.pressure-a.pressure)*f,progress:p}}
export function blend(base,type='milk',ratio=2){const r=type==='black'?0:clamp(Number(ratio)||0,0,3);const addedMass=base.mass*r,totalMass=base.mass+addedMass;return {type,ratio:r,coffeeMass:base.mass,addedMass,totalMass,coffeeFraction:totalMass>0?base.mass/totalMass:0,solutes:base.solutes,coffeeSoluteConcentration:totalMass>0?base.solutes/totalMass*100:0,baseConcentration:base.concentration}}
