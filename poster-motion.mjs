// Blender projection anchors transformed by the same bounded CSS pose.
export function transformedPoint([u,v],{x=0,scale=1,rotation=0}={}){
 const px=(u-.5)*960*scale,py=(v-.8)*1200*scale,a=rotation*Math.PI/180;
 return [480+px*Math.cos(a)-py*Math.sin(a)+x*9.6,960+px*Math.sin(a)+py*Math.cos(a)];
}
export function liquidPath(from,to){
 const [x,y]=from,[tx,ty]=to;
 if(![x,y,tx,ty].every(Number.isFinite)||ty<=y)return '';
 return `M ${x} ${y} Q ${x+(tx-x)*.16} ${y+(ty-y)*.65} ${tx} ${ty}`;
}
