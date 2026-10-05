import * as THREE from './vendor/three.module.js';
export function createMoka(canvas,onPart){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3,3,4,-4,.1,100);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 scene.add(new THREE.AmbientLight(0xffffff,1.8));const key=new THREE.DirectionalLight(0xfff3d8,3.8);key.position.set(-4,7,6);scene.add(key);const fill=new THREE.DirectionalLight(0xffffff,2.1);fill.position.set(5,3,-4);scene.add(fill);
 const silver=new THREE.MeshStandardMaterial({color:0xe4e0d5,metalness:.3,roughness:.47,flatShading:true}),inner=new THREE.MeshStandardMaterial({color:0xa8a397,metalness:.25,roughness:.55,side:THREE.DoubleSide}),black=new THREE.MeshStandardMaterial({color:0x242522,roughness:.62}),brass=new THREE.MeshStandardMaterial({color:0xc68d39,metalness:.5,roughness:.4}),coffee=new THREE.MeshStandardMaterial({color:0x49301c,roughness:1});
 const root=new THREE.Group();scene.add(root);root.rotation.z=-.16;root.rotation.y=.25;const groups=[];
 function group(name,y){const g=new THREE.Group();g.userData.part=name;g.position.y=y;g.userData.baseY=y;root.add(g);groups.push(g);return g}
 function mesh(g,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat.clone());m.position.set(x,y,z);g.add(m);return m}
 function vessel(g,profile,material=silver){return mesh(g,new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),8),material)}
 const lower=group('lower',0);
 vessel(lower,[[.97,0],[1.12,.12],[.92,1.36],[.78,1.43],[.78,1.52],[.7,1.52],[.7,1.38],[.83,1.3],[1.0,.16],[.92,.1],[.97,0]]);
 mesh(lower,new THREE.CylinderGeometry(.96,.96,.05,8),silver,0,.045);
 for(let i=0;i<3;i++)mesh(lower,new THREE.TorusGeometry(.75,.022,5,56),silver,0,1.45+i*.027).rotation.x=Math.PI/2;
 const valve=mesh(lower,new THREE.CylinderGeometry(.105,.105,.06,6),brass,.68,1.07,.7);valve.rotation.x=Math.PI/2;mesh(lower,new THREE.CylinderGeometry(.045,.045,.073,16),black,.68,1.07,.736).rotation.x=Math.PI/2;
 const basket=group('basket',1.06);vessel(basket,[[.2,0],[.7,.2],[.7,.46],[.65,.46],[.65,.24],[.15,.05],[.2,0]],inner);mesh(basket,new THREE.CylinderGeometry(.65,.65,.035,40),coffee,0,.425);mesh(basket,new THREE.CylinderGeometry(.105,.105,1.02,20),silver,0,-.50);
 const gasket=group('gasket',1.55);mesh(gasket,new THREE.TorusGeometry(.69,.055,10,48),black).rotation.x=Math.PI/2;
 const disk=group('filter',1.60);mesh(disk,new THREE.CylinderGeometry(.735,.735,.045,48),silver);for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)if(x*x+z*z<20)mesh(disk,new THREE.CylinderGeometry(.022,.022,.048,6),black,x*.14,.007,z*.14);
 const upper=group('upper',1.60);vessel(upper,[[.77,0],[.84,.14],[1.13,1.18],[1.12,1.32],[1.02,1.32],[1.025,1.18],[.74,.2],[.7,.13],[.77,0]]);mesh(upper,new THREE.CylinderGeometry(.74,.74,.075,8),silver,0,.09);mesh(upper,new THREE.CylinderGeometry(.14,.17,1.14,16),silver,0,.68);mesh(upper,new THREE.TorusGeometry(.145,.035,8,32),silver,0,1.24).rotation.x=Math.PI/2;
 const handle=new THREE.Shape();handle.moveTo(1.01,1.17);handle.lineTo(1.54,1.12);handle.lineTo(1.83,.78);handle.lineTo(1.67,-.04);handle.lineTo(1.27,-.1);handle.lineTo(1.24,.1);handle.lineTo(1.46,.1);handle.lineTo(1.59,.73);handle.lineTo(1.39,.92);handle.lineTo(1.01,.95);handle.closePath();mesh(upper,new THREE.ExtrudeGeometry(handle,{depth:.20,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.03,bevelThickness:.02}),black,0,0,-.1);
 const spout=new THREE.Shape();spout.moveTo(-1.04,1.30);spout.lineTo(-1.45,1.35);spout.lineTo(-1.27,1.06);spout.lineTo(-1.0,1.04);spout.closePath();mesh(upper,new THREE.ExtrudeGeometry(spout,{depth:.22,bevelEnabled:false}),silver,0,0,-.11);
 const lid=group('lid',2.94);mesh(lid,new THREE.ConeGeometry(1.16,.15,8),silver,0,.075);mesh(lid,new THREE.CylinderGeometry(.145,.205,.34,6),black,0,.29);
 let expansion=0,visible=true,drag=null,moved=false,active='basket',reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){const {width:w,height:h}=canvas.getBoundingClientRect();if(!w||!h)return;renderer.setSize(w,h,false);const half=2.8+expansion*1.15;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.position.set(5,3.4,9);camera.lookAt(0,0,0);camera.updateProjectionMatrix();renderer.render(scene,camera)}
 function expand(n){expansion=Math.max(0,Math.min(1,n));const steps=[0,.75,1.15,1.5,2.0,2.7];groups.forEach((g,i)=>g.position.y=g.userData.baseY+steps[i]*expansion);root.position.y=-1.52-expansion*1.35;resize()}
 function select(name){active=name;groups.forEach(g=>g.traverse(o=>{if(o.isMesh)o.material.emissive?.setHex(g.userData.part===name&&expansion>.1?0x34200e:0x000000)}));renderer.render(scene,camera)}
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,rx:root.rotation.x,ry:root.rotation.y};moved=false;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;root.rotation.y=drag.ry+dx*.009;root.rotation.x=THREE.MathUtils.clamp(drag.rx+dy*.003,-.35,.35);renderer.render(scene,camera)});
 canvas.addEventListener('pointerup',e=>{if(drag&&!moved){const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObject(root,true)[0];if(hit){let o=hit.object;while(o&&!o.userData.part)o=o.parent;if(o){select(o.userData.part);onPart(o.userData.part)}}}drag=null});canvas.addEventListener('pointercancel',()=>drag=null);
 new ResizeObserver(resize).observe(canvas);expand(0);
 return {expand,select,setVisible(v){visible=v;canvas.style.visibility=v?'visible':'hidden'},reset(){root.rotation.set(0,.25,-.16);renderer.render(scene,camera)},render(){if(visible)renderer.render(scene,camera)},get renderer(){return renderer}};
}
