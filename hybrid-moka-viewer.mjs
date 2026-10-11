import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

// Only assembly-axis motion and bounded inspection. No liquid collision,
// lid hinge, threading, or independently movable hardware in this viewer.
export function createHybridMoka(canvas,{onPart=()=>{},onAnchors=()=>{}}={}){
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-4,4,4,-4,.1,80);
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 const envScene=new RoomEnvironment(renderer),pmrem=new T.PMREMGenerator(renderer);
 // Tall window strips and a dark flag create the long restrained reflections
 // seen on the reference aluminium, instead of a uniformly white studio dome.
 for(const [x,y,z,w,h,power] of [[-4,4,7,2,10,3],[-1.2,3,6,1.4,11,.012],[3,5,-5,1,9,4]]){
  const material=new T.MeshBasicMaterial({side:T.DoubleSide});material.color.setScalar(power);
  const card=new T.Mesh(new T.PlaneGeometry(w,h),material);card.position.set(x,y,z);card.lookAt(0,2,0);envScene.add(card);
 }
 const environment=pmrem.fromScene(envScene,.035);scene.environment=environment.texture;pmrem.dispose();envScene.dispose();
 scene.add(new T.HemisphereLight(0xfff7e7,0x5d584d,.3));
 const key=new T.DirectionalLight(0xfff4e2,1.0);key.position.set(-4,7,5);scene.add(key);
 const fill=new T.DirectionalLight(0xf4f8ff,.48);fill.position.set(6,2,-3);scene.add(fill);
 const rig=new T.Group();scene.add(rig);rig.position.y=-.43;
 const groups={},meshes=[],outlines=[],offsets={lower:0,basket:1.3,gasket:1.66,filter:1.86,upper:2.5,lid:3.1};
 const materials={
  cast:new T.MeshPhysicalMaterial({name:'Satin cast aluminium',color:0xd8d8d4,metalness:.98,roughness:.27,envMapIntensity:1.0,clearcoat:.08,clearcoatRoughness:.38}),
  polished:new T.MeshStandardMaterial({name:'Turned aluminium',color:0xe7e8e4,metalness:.98,roughness:.19,envMapIntensity:1.2}),
  bakelite:new T.MeshPhysicalMaterial({name:'Bakelite handle',color:0x141613,roughness:.31,specularIntensity:.55,clearcoat:.18,clearcoatRoughness:.3}),
  rubber:new T.MeshStandardMaterial({name:'Matte seal',color:0x211f18,roughness:.86}),
  brass:new T.MeshStandardMaterial({name:'Brass valve',color:0xb98b42,metalness:.9,roughness:.3})
 };
 // A very small cast surface response, not ornamental noise or a photo map.
 materials.cast.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMetalPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMetalPoint = position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vMetalPoint;
float metalHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float castNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(metalHash(i),metalHash(i+vec3(1,0,0)),f.x),mix(metalHash(i+vec3(0,1,0)),metalHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(metalHash(i+vec3(0,0,1)),metalHash(i+vec3(1,0,1)),f.x),mix(metalHash(i+vec3(0,1,1)),metalHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat grainAA=1.0-smoothstep(.8,2.8,length(fwidth(vMetalPoint*100.0)));\nfloat grain=(metalHash(floor(vMetalPoint*175.0))-.5)*grainAA;\nfloat casting=castNoise(vMetalPoint*73.0)-.5;\nroughnessFactor=clamp(roughnessFactor+casting*.065+grain*.025,.22,.36);\ndiffuseColor.rgb*=1.0+casting*.04+grain*.026;');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat castGrain=castNoise(vMetalPoint*175.0);\nnormal=normalize(normal+vec3(dFdx(castGrain),dFdy(castGrain),0.0)*.028);');
 };materials.cast.customProgramCacheKey=()=> 'hybrid-satin-v14';
 const neutral={yaw:-.24,pitch:.035,roll:-.20};
 let current=.7,target=.7,yaw=neutral.yaw,desiredYaw=neutral.yaw,pitch=neutral.pitch,desiredPitch=neutral.pitch,active='basket',hovered=null,readyState=false,drag=null,moved=false,last=0,disposed=false,lastSize='';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),ray=new T.Raycaster();
 // Upper annotations start outside the handle, so opaque label backgrounds
 // cannot erase its middle and make a sound mesh look broken.
 const anchors={lid:new T.Vector3(.18,3.5,0),upper:new T.Vector3(1.53,2.5,0),filter:new T.Vector3(.48,1.72,0),gasket:new T.Vector3(.55,1.69,0),basket:new T.Vector3(.5,1.55,0),lower:new T.Vector3(.7,1.04,0)};
 function size(){
  const host=canvas.parentElement,w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  const ratio=Math.min(devicePixelRatio,1.75),stamp=[w,h,ratio].join(':');
  if(stamp!==lastSize){renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);lastSize=stamp;}
  return {w,h};
 }
 function draw(){
  const s=size();if(!s)return;
  for(const [p,g] of Object.entries(groups))g.position.y=offsets[p]*current;
  rig.rotation.set(pitch,yaw,neutral.roll);rig.updateMatrixWorld(true);
  const box=readyState?new T.Box3().setFromObject(rig):new T.Box3(new T.Vector3(-1,0,-1),new T.Vector3(1,5.6,1));
  const center=box.getCenter(new T.Vector3());
  camera.position.copy(center).add(new T.Vector3(4.1,1.7,10));camera.lookAt(center);camera.updateMatrixWorld(true);
  let halfY=0,halfX=0;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const v=new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);halfY=Math.max(halfY,Math.abs(v.y));halfX=Math.max(halfX,Math.abs(v.x));}
  const half=Math.max(halfY*1.025,halfX*1.07/(s.w/s.h));
  camera.left=-half*s.w/s.h;camera.right=half*s.w/s.h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const a={};for(const [p,v] of Object.entries(anchors)){
   const world=rig.localToWorld(v.clone().add(new T.Vector3(0,offsets[p]*current,0))).project(camera);
   a[p]={x:(world.x*.5+.5)*s.w,y:(.5-world.y*.5)*s.h,visible:current>.48};
  }onAnchors(a,current);renderer.render(scene,camera);
 }
 const ready=new GLTFLoader().loadAsync('assets/hybrid/moka-v1.glb').then(gltf=>{
  gltf.scene.updateMatrixWorld(true);
  for(const name of Object.keys(offsets)){const group=new T.Group();group.userData.part=name;groups[name]=group;rig.add(group);}
  const objects=[];gltf.scene.traverse(o=>{if(o.isMesh)objects.push(o);});
  for(const ob of objects){const part=ob.userData.part||ob.parent?.userData.part;if(!groups[part])continue;
   ob.geometry.applyMatrix4(ob.matrixWorld);ob.position.set(0,0,0);ob.quaternion.identity();ob.scale.set(1,1,1);
   const finish=ob.userData.finish||'cast';ob.material=(materials[finish]||materials.cast).clone();ob.material.vertexColors=!!ob.geometry.attributes.color;
   if(finish==='cast'){ob.material.onBeforeCompile=materials.cast.onBeforeCompile;ob.material.customProgramCacheKey=materials.cast.customProgramCacheKey;}
   ob.userData.part=part;groups[part].add(ob);meshes.push(ob);
   if(!/thread|rivet|perforation|valve/i.test(ob.name)){
    const borderMaterial=new T.MeshBasicMaterial({color:0xb75a2d,side:T.BackSide,transparent:true,opacity:.9,depthWrite:false});
    borderMaterial.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','vec3 transformed = position + normal * .007;');};
    borderMaterial.customProgramCacheKey=()=> 'moka-part-outline-v1';
    const border=new T.Mesh(ob.geometry,borderMaterial);border.userData.part=part;border.visible=false;border.renderOrder=-1;ob.add(border);outlines.push(border);
   }
   if(!/thread|rivet|perforation|valve/i.test(ob.name)){
    const edges=new T.LineSegments(new T.EdgesGeometry(ob.geometry,36),new T.LineBasicMaterial({color:0xb75a2d,transparent:true,opacity:.8,depthWrite:false}));
    edges.userData.part=part;edges.visible=false;edges.renderOrder=2;ob.add(edges);outlines.push(edges);
   }
  }readyState=true;canvas.dataset.model='hybrid-moka-v1';select(active);draw();return true;
 });
 function highlight(){for(const ob of meshes)ob.material.emissive.setHex(ob.userData.part===hovered?0x100b04:0);for(const edge of outlines){edge.visible=edge.userData.part===active||edge.userData.part===hovered;edge.material.opacity=edge.userData.part===active?.68:.34;}}
 function select(part){active=part;highlight();draw();}
 function expand(value){target=T.MathUtils.clamp(Number(value)||0,0,1);if(reduced.matches)current=target;draw();}
 function reset(){desiredYaw=neutral.yaw;desiredPitch=neutral.pitch;if(reduced.matches){yaw=desiredYaw;pitch=desiredPitch;}draw();}
 function hitPart(e){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)),camera);return ray.intersectObjects(meshes,false)[0]?.object.userData.part||null;}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:desiredYaw,pitch:desiredPitch};moved=false;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag){const next=readyState?hitPart(e):null;if(next!==hovered){hovered=next;highlight();canvas.style.cursor=next?'pointer':'grab';draw();}return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;canvas.style.cursor='grabbing';desiredYaw=T.MathUtils.clamp(drag.yaw+dx*.0045,-.65,.3);desiredPitch=T.MathUtils.clamp(drag.pitch+dy*.0013,-.07,.12);});
 canvas.addEventListener('pointerup',e=>{if(drag&&!moved&&readyState){const p=hitPart(e);if(p){select(p);onPart(p);}}drag=null;canvas.style.cursor='grab';});
 canvas.addEventListener('pointerleave',()=>{if(!drag){hovered=null;highlight();draw();}});
 canvas.addEventListener('pointercancel',()=>drag=null);
 function animate(now){if(disposed)return;const dt=last?Math.min(.1,(now-last)/1000):.016;last=now;
  const k=reduced.matches?1:1-Math.exp(-dt*7.5),changing=Math.abs(target-current)+Math.abs(desiredYaw-yaw)+Math.abs(desiredPitch-pitch)>.0001;
  if(changing){current+=(target-current)*k;yaw+=(desiredYaw-yaw)*k;pitch+=(desiredPitch-pitch)*k;draw();}
  requestAnimationFrame(animate);
 }
 const observer=new ResizeObserver(draw);observer.observe(canvas.parentElement);requestAnimationFrame(animate);draw();
 return {ready,expand,select,reset,get state(){return {ready:readyState,expansion:current,target,yaw,pitch,parts:Object.keys(groups)};},audit(){return Object.entries(groups).map(([name,g])=>({name,offset:g.position.y,min:new T.Box3().setFromObject(g).min.toArray(),max:new T.Box3().setFromObject(g).max.toArray()}));},dispose(){disposed=true;observer.disconnect();renderer.dispose();environment.dispose();}};
}
