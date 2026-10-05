import {clamp,SPEC,isHot,waterFlow,powderFlow} from './workshop-state.mjs';

// The learner chooses quantities; lifting, scooping and turning are presentation.
export function measureWater(s,amount){
 if(s.started||isHot(s)||s.open<.95)return '制作已经开始，水位不能再改；冷却后再准备新一锅。';
 // The display lifts the basket automatically before changing the lower chamber.
 s.basketIn=false;
 return waterFlow(s,clamp(amount,0,SPEC.tankMax)-s.water,1);
}
export function measurePowder(s,amount){
 if(s.started||isHot(s)||s.open<.95)return '制作已经开始，粉量不能再改。';
 amount=clamp(amount,0,SPEC.powder);
 if(amount>=s.powder)return powderFlow(s,amount-s.powder,1);
 s.powder=amount;s.crumbs=0;return '';
}
export function reviseBlend(s,type,amount){
 if(!['water','milk','ice'].includes(type)||s.poured<1)return '先出杯，再调整配方。';
 const others=s.poured+Object.entries(s.cup).filter(([key])=>key!==type&&['water','milk','ice'].includes(key)).reduce((sum,[,n])=>sum+n,0);
 s.cup[type]=clamp(amount,0,SPEC.cupMax-others);
 if(s.cup[type]>0&&!s.events.includes(type+'-added'))s.events.push(type+'-added');
 return s.cup[type]<amount?'杯中总量不能超过 350 g，已保留其他材料的用量。':'';
}
