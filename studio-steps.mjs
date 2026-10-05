export const PREPARATION={
 moka:[
  {id:'water',name:'给下壶加水',short:'加水',hold:true,unit:'g',explain:'把水装进下壶，留出气体空间。真实器具按说明书装水，水位应低于安全阀。本页的克数是教学预设。'},
  {id:'powder',name:'装入咖啡粉',short:'装粉',hold:true,unit:'g',explain:'咖啡粉放进漏斗粉篮，铺平即可。摩卡壶的咖啡粉不需要像意式粉饼那样压实。'},
  {id:'assemble',name:'合上摩卡壶',short:'合壶',hold:false,explain:'装好粉篮，检查滤网与密封圈，再连接上下壶。组装完成后去炉头上加热。'}
 ],
 pour:[
  {id:'paper',name:'放入滤纸',short:'滤纸',hold:false,explain:'让滤纸贴合滤杯。可以把下面的滤纸拖到滤杯里，也可以点击放入。'},
  {id:'rinse',name:'润洗滤纸，倒掉清水',short:'润洗',hold:true,unit:'g',explain:'用热水润湿滤纸并预热器具，倒掉分享壶中的润洗水，再放入咖啡粉。本页把润洗与倒水合为一个动作。'},
  {id:'powder',name:'称量并装入咖啡粉',short:'装粉',hold:true,unit:'g',explain:'确认粉量，装入滤杯，轻轻铺平。接下来用自己的节奏注水，观察水位与滴落。'}
 ],
 espresso:[
  {id:'powder',name:'称量，装入滤篮',short:'装粉',hold:true,unit:'g',explain:'称量咖啡粉，装进滤篮。本次粉量与最终出杯量一起构成你的冲煮比例。'},
  {id:'level',name:'把咖啡粉分布均匀',short:'布粉',hold:true,explain:'在粉面上拖动，或按住布粉按钮，让粉床分布更均匀。图中的粉面是操作示意。'},
  {id:'tamp',name:'压平粉饼',short:'压粉',hold:true,explain:'按住压粉器，完成压粉。界面只表现这个动作，不测量真实压粉力；完成后将手柄装入冲煮头。'}
 ]
};
export function newPreparation(){return {water:0,powder:0,paper:false,rinse:0,assembled:false,level:0,tamp:0,quick:false,manual:[]};}
export function targetFor(task,settings){return task==='water'?settings.water:task==='powder'?settings.dose:task==='rinse'?40:1;}
export function taskComplete(prep,task,settings){const target=targetFor(task,settings);return task==='assemble'?prep.assembled:task==='paper'?prep.paper:Number(prep[task])>=target-.001;}
export function taskAllowed(gear,prep,task,settings){
 if(gear==='moka'&&task==='assemble')return taskComplete(prep,'water',settings)&&taskComplete(prep,'powder',settings);
 if(gear==='pour'&&task==='rinse')return prep.paper;
 if(gear==='pour'&&task==='powder')return prep.paper&&taskComplete(prep,'rinse',settings);
 if(gear==='espresso'&&task==='level')return taskComplete(prep,'powder',settings);
 if(gear==='espresso'&&task==='tamp')return taskComplete(prep,'level',settings);
 return true;
}
export function preparationReady(gear,prep,settings){return PREPARATION[gear].every(t=>taskComplete(prep,t.id,settings));}
export function nextPreparationTask(gear,prep,settings){return PREPARATION[gear].find(t=>!taskComplete(prep,t.id,settings))?.id||PREPARATION[gear].at(-1).id;}
export function advancePreparation(gear,prep,task,settings,dt){
 if(!taskAllowed(gear,prep,task,settings))return false;
 const target=targetFor(task,settings);prep.quick=false;
 if(task==='assemble')prep.assembled=true;
 else if(task==='paper')prep.paper=true;
 else prep[task]=Math.min(target,prep[task]+Math.max(0,Math.min(dt,.1))*({water:85,powder:14,rinse:30,level:.9,tamp:1.1}[task]||0));
 const done=taskComplete(prep,task,settings);if(done){if(!['paper','assemble'].includes(task))prep[task]=target;prep.manual||=[];if(!prep.manual.includes(task))prep.manual.push(task);}return done;
}
export function quickPreparation(gear,prep,settings){for(const task of PREPARATION[gear]){const key=task.id==='assemble'?'assembled':task.id;prep[key]=['paper','assemble'].includes(task.id)?true:targetFor(task.id,settings);}prep.quick=true;prep.manual=[];return prep;}
