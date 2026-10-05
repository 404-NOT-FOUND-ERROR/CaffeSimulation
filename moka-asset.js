import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// Supplied exterior + explicitly supplemental teaching internals.
export function createMoka(canvas,onPart){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3,3,4,-4,.1,100);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 // A small product-photo studio: broad bright cards and dark flags give aluminium readable reflections.
 const pmrem=new THREE.PMREMGenerator(renderer),studio=new THREE.Scene();
 studio.add(new THREE.Mesh(new THREE.SphereGeometry(25,32,16),new THREE.MeshBasicMaterial({color:0x5d6269,side:THREE.BackSide})));
 const cards=[[-6,2,6,3,12,.08,3.2],[4,3,7,4,10,.08,2.3],[3,2,-7,4,12,.08,2.5],[0,10,0,12,.08,10,2.5],[-9,1,0,.08,14,10,.035]];
 for(const [x,y,z,w,h,d,intensity] of cards){const mat=new THREE.MeshBasicMaterial();mat.color.setScalar(intensity);const card=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);card.position.set(x,y,z);studio.add(card);}
 const env=pmrem.fromScene(studio,.035);scene.environment=env.texture;studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});pmrem.dispose();
 scene.add(new THREE.AmbientLight(0xffffff,.35));
 const key=new THREE.DirectionalLight(0xfff4de,2.2);key.position.set(-4,6,5);scene.add(key);
 const fill=new THREE.DirectionalLight(0xd6e9ff,.8);fill.position.set(4,2,-3);scene.add(fill);
 const root=new THREE.Group();scene.add(root);root.rotation.set(0,.25,-.16);
 const groups={};for(const name of ['lower','basket','gasket','filter','upper','lid']){const g=new THREE.Group();g.name=name;g.userData.part=name;g.userData.baseY=0;root.add(g);groups[name]=g;}
 const silver=new THREE.MeshStandardMaterial({color:0xcdd0d2,metalness:.98,roughness:.29,side:THREE.DoubleSide,envMapIntensity:1}),black=new THREE.MeshStandardMaterial({color:0x171817,roughness:.48}),coffee=new THREE.MeshStandardMaterial({color:0x392211,roughness:1}),brass=new THREE.MeshStandardMaterial({color:0xbe965b,metalness:.85,roughness:.3});
 // Subtle isotropic machining grain; no blue paint or wood maps on the final shell.
 const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=256;const gc=grainCanvas.getContext('2d'),grain=gc.createImageData(256,256);let seed=29;
 for(let i=0;i<grain.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=212+(seed>>>24)/255*35;grain.data[i]=grain.data[i+1]=grain.data[i+2]=v;grain.data[i+3]=255;}gc.putImageData(grain,0,0);
 const grainMap=new THREE.CanvasTexture(grainCanvas);grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping;grainMap.repeat.set(9,9);silver.roughnessMap=grainMap;
 function mesh(group,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat.clone());m.position.set(x,y,z);group.add(m);return m;}
 function vessel(group,profile){return mesh(group,new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),64),silver);}
 const valve=mesh(groups.lower,new THREE.CylinderGeometry(.078,.078,.065,6),brass,.22,.88,.75);valve.rotation.x=Math.PI/2;
 mesh(groups.lower,new THREE.TorusGeometry(.046,.010,10,40),brass,.22,.88,.792);
 mesh(groups.lower,new THREE.CylinderGeometry(.025,.025,.066,24),black,.22,.88,.794).rotation.x=Math.PI/2;
 vessel(groups.lower,[[.515,1.20],[.562,1.23],[.562,1.37],[.515,1.37],[.515,1.20]]);
 class Thread extends THREE.Curve{getPoint(t,target=new THREE.Vector3()){const a=t*Math.PI*6;return target.set(.565*Math.cos(a),1.23+t*.13,.565*Math.sin(a));}}
 mesh(groups.lower,new THREE.TubeGeometry(new Thread(),180,.012,7,false),silver);
 vessel(groups.basket,[[.11,1.015],[.48,1.07],[.50,1.255],[.46,1.255],[.445,1.1],[.08,1.045],[.11,1.015]]);
 mesh(groups.basket,new THREE.CylinderGeometry(.085,.085,.79,32),silver,0,.62);
 const coffeeBed=mesh(groups.basket,new THREE.CylinderGeometry(.455,.455,.024,64),coffee,0,1.23);
 mesh(groups.basket,new THREE.TorusGeometry(.483,.012,10,64),silver,0,1.25).rotation.x=Math.PI/2;
 const grounds=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.009,0),coffee.clone(),450),tmp=new THREE.Object3D();let gs=13;
 const random=()=>{gs=(gs*1664525+1013904223)>>>0;return gs/4294967296;};
 for(let i=0;i<450;i++){const r=.435*Math.sqrt(random()),a=random()*Math.PI*2;tmp.position.set(r*Math.cos(a),1.245+random()*.012,r*Math.sin(a));tmp.rotation.set(random()*3,random()*3,random()*3);tmp.scale.set(1.3,.75,1);tmp.updateMatrix();grounds.setMatrixAt(i,tmp.matrix);}groups.basket.add(grounds);
 const waterFill=mesh(groups.lower,new THREE.CylinderGeometry(.455,.455,1,64),new THREE.MeshPhysicalMaterial({color:0x9ac5ca,metalness:0,roughness:.12,transparent:true,opacity:.75}),0,.4);
 const coffeeFill=mesh(groups.upper,new THREE.CylinderGeometry(.44,.44,1,64),new THREE.MeshStandardMaterial({color:0x462919,roughness:.19}),0,1.8);
 waterFill.visible=false;coffeeFill.visible=false;
 mesh(groups.gasket,new THREE.TorusGeometry(.51,.037,16,64),black,0,1.30).rotation.x=Math.PI/2;
 const filterShape=new THREE.Shape();filterShape.absarc(0,0,.50,0,Math.PI*2,false);
 for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)if(x*x+z*z<20){const hole=new THREE.Path();hole.absarc(x*.10,z*.10,.017,0,Math.PI*2,true);filterShape.holes.push(hole);}
 const filter=mesh(groups.filter,new THREE.ExtrudeGeometry(filterShape,{depth:.020,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,curveSegments:10}),silver,0,1.34);filter.rotation.x=-Math.PI/2;
 mesh(groups.upper,new THREE.CylinderGeometry(.50,.50,.045,64),silver,0,1.43);
 mesh(groups.upper,new THREE.CylinderGeometry(.095,.13,1.30,32),silver,0,2.11);
 mesh(groups.upper,new THREE.TorusGeometry(.095,.015,10,40),silver,0,2.76).rotation.x=Math.PI/2;
 const handleShape=new THREE.Shape();handleShape.moveTo(.72,2.71);handleShape.lineTo(1.31,2.69);handleShape.quadraticCurveTo(1.41,2.67,1.48,2.57);handleShape.lineTo(1.69,2.29);handleShape.quadraticCurveTo(1.73,2.23,1.70,2.12);handleShape.lineTo(1.54,1.40);handleShape.quadraticCurveTo(1.51,1.31,1.42,1.30);handleShape.lineTo(1.14,1.30);handleShape.lineTo(1.10,1.49);handleShape.lineTo(1.31,1.52);handleShape.lineTo(1.48,2.22);handleShape.lineTo(1.28,2.47);handleShape.lineTo(.72,2.48);handleShape.closePath();
 mesh(groups.upper,new THREE.ExtrudeGeometry(handleShape,{depth:.18,bevelEnabled:true,bevelSize:.025,bevelThickness:.026,bevelSegments:4,curveSegments:16}),black,0,0,-.09);
 mesh(groups.upper,new THREE.BoxGeometry(.15,.14,.25),silver,.73,2.64,0);
 mesh(groups.upper,new THREE.CylinderGeometry(.035,.035,.018,32),silver,.73,2.64,.145).rotation.x=Math.PI/2;
 const knobProfile=[[.09,2.97],[.12,2.99],[.165,3.23],[.153,3.26],[0,3.26]].map(([r,y])=>new THREE.Vector2(r,y));
 mesh(groups.lid,new THREE.LatheGeometry(knobProfile,6),black);
 mesh(groups.lid,new THREE.CylinderGeometry(.115,.115,.020,40),silver,0,2.977);
 let expansion=0,visible=true,drag=null,moved=false,active='',status='loading',lastWidth=0,lastHeight=0,lastRatio=0,resizeCount=0;
 const host=canvas.parentElement;
 const offsets={lower:0,basket:.85,gasket:1.1,filter:1.35,upper:1.85,lid:2.5};
 function resize(){
  // CSS controls the host; the drawing buffer never participates in layout.
  const w=Math.round(host.clientWidth),h=Math.round(host.clientHeight);if(!w||!h)return;
  const ratio=Math.min(devicePixelRatio,2);
  if(w!==lastWidth||h!==lastHeight||ratio!==lastRatio){renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;lastRatio=ratio;resizeCount++;}
  camera.position.set(4,3.1,10);camera.lookAt(.20,0,0);camera.updateMatrixWorld();root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);let extentX=0,extentY=0;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const v=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);extentX=Math.max(extentX,Math.abs(v.x));extentY=Math.max(extentY,Math.abs(v.y));}
  const aspect=w/h,baseHalf=2.68+expansion*1.10;
  const half=Math.max(baseHalf,extentY/.84,extentX/(aspect*.87),baseHalf*h/880);
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();if(visible)renderer.render(scene,camera);
 }
 function expand(n){expansion=THREE.MathUtils.clamp(Number(n)||0,0,1);for(const [name,g] of Object.entries(groups))g.position.y=offsets[name]*expansion;root.position.y=-1.58-expansion*1.25;resize();}
 function select(name){active=name;root.traverse(o=>{if(o.isMesh){let p=o;while(p&&!p.userData.part)p=p.parent;const selected=p?.userData.part===name&&expansion>.1;o.material.emissive?.setHex(selected?0x251b10:0);}});if(visible)renderer.render(scene,camera);}
 function setContents({water=0,powder=1,coffee=0}={}){const w=THREE.MathUtils.clamp(water,0,1),c=THREE.MathUtils.clamp(coffee,0,1),p=THREE.MathUtils.clamp(powder,0,1);waterFill.visible=w>0;waterFill.scale.y=Math.max(.001,w*.60);waterFill.position.y=.16+w*.30;coffeeFill.visible=c>0;coffeeFill.scale.y=Math.max(.001,c*.82);coffeeFill.position.y=1.47+c*.41;grounds.count=Math.round(p*450);coffeeBed.visible=p>0;if(visible)renderer.render(scene,camera);}
 const ready=new GLTFLoader().loadAsync('./assets/moka-silver-v2.glb').then(gltf=>{
  gltf.scene.updateMatrixWorld(true);const items=[];
  gltf.scene.traverse(o=>{if(o.isMesh)items.push(o)});
  for(const o of items){const part=o.userData.part||o.parent.name;const g=groups[part];if(!g||o.name==='wood-handle'||o.name==='wood-knob')continue;
   o.geometry.applyMatrix4(o.matrixWorld);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.material=silver.clone();o.material.name='Satin aluminium';
   g.add(o);
   if(o.name==='lower-shell'||o.name==='upper-shell'){
    const geometry=o.geometry.clone(),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){positions.setX(i,positions.getX(i)*.975);positions.setZ(i,positions.getZ(i)*.975);}
    positions.needsUpdate=true;geometry.computeVertexNormals();
    const lining=new THREE.Mesh(geometry,silver.clone());lining.name='supplemental-inner-lining';lining.material.side=THREE.BackSide;g.add(lining);
   }
  }
  status='ready';canvas.dataset.model='blenderco';canvas.dataset.finish='silver-black';expand(expansion);if(active)select(active);return gltf;
 }).catch(error=>{status='error';canvas.dataset.model='error';console.error('Moka model failed to load',error);const hint=document.querySelector('#modelHint');if(hint)hint.textContent='模型加载失败，请刷新重试';throw error;});
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,rx:root.rotation.x,ry:root.rotation.y};moved=false;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;root.rotation.y=drag.ry+dx*.009;root.rotation.x=THREE.MathUtils.clamp(drag.rx+dy*.003,-.35,.35);renderer.render(scene,camera);});
 canvas.addEventListener('pointerup',e=>{if(drag&&!moved){const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObject(root,true)[0];if(hit){let o=hit.object;while(o&&!o.userData.part)o=o.parent;if(o){select(o.userData.part);onPart(o.userData.part);}}}drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);
 new ResizeObserver(resize).observe(host);window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);expand(0);
 return {ready,expand,select,setContents,setVisible(v){visible=v;canvas.style.visibility=v?'visible':'hidden';if(v)resize();},reset(){root.rotation.set(0,.25,-.16);resize();},render(){if(visible)renderer.render(scene,camera);},get renderer(){return renderer;},get status(){return status;},getLayout(){return {width:lastWidth,height:lastHeight,ratio:lastRatio,resizeCount,half:camera.top};},getParts(){return Object.entries(groups).map(([name,g])=>({name,offset:g.position.y,meshes:g.children.length}));}};
}
