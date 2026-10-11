// Tapered glass profile; nominal mass is a volume proxy in this illustration.
// These levels illustrate proportions, not measurements of foam/ice density.
export function fillHeight(amount){
 const f=Math.max(0,Math.min(1,amount/360)),r=71,s=17;
 const volume=q=>r*r*q+r*s*q*q+s*s*q*q*q/3;
 let lo=0,hi=1;for(let i=0;i<22;i++){const mid=(lo+hi)/2;if(volume(mid)<f*volume(1))lo=mid;else hi=mid;}
 return f===0?0:f===1?302:(lo+hi)/2*302;
}
