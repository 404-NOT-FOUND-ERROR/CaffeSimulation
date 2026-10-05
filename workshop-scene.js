import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {coffeeLeft,totalCup,SPEC} from './workshop-state.mjs';
import {createWorkshopAmbience} from './workshop-ambience.js';
import {upperPotPose} from './preparation-motion.mjs';

export function createWorkshopScene(canvas){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,100);
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});
 renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;
 const pmrem=new T.PMREMGenerator(renderer),envScene=new T.Scene();
 envScene.add(new T.Mesh(new T.SphereGeometry(25,24,12),new T.MeshBasicMaterial({color:0x473b31,side:T.BackSide})));
 // Broad soft boxes face the vessel; a dark flag leaves a readable silver edge.
 for(const [x,y,z,w,h,power] of [[-4,1.5,5,2.2,10,3.0],[-1,-2,7,2,7,1.8],[4,1.5,4,1.2,8,2.1],[-1,4,-4,3,6,2.3],[0,8,0,7,6,1.7],[3,2,-1,2,5,.13]]){
  const m=new T.MeshBasicMaterial({side:T.DoubleSide});m.color.setScalar(power);const card=new T.Mesh(new T.PlaneGeometry(w,h),m);card.position.set(x,y,z);card.lookAt(0,1.5,0);envScene.add(card);
 }
 const env=pmrem.fromScene(envScene,.025);scene.environment=env.texture;pmrem.dispose();envScene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
 scene.add(new T.HemisphereLight(0xfff7e8,0x735944,.65));
 const key=new T.DirectionalLight(0xffe4bd,2.9);key.position.set(-3.5,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=7;key.shadow.camera.bottom=-4;key.shadow.normalBias=.025;key.shadow.bias=-.0001;key.shadow.radius=7;key.shadow.blurSamples=12;scene.add(key);
 const fill=new T.DirectionalLight(0xfff4dd,.38);fill.position.set(5,3,-3);scene.add(fill);
 const silver=new T.MeshStandardMaterial({color:0xe2e3e1,metalness:1,roughness:.34,envMapIntensity:1.0,side:T.DoubleSide});
 const machining=document.createElement('canvas');machining.width=machining.height=256;const mc=machining.getContext('2d'),grain=mc.createImageData(256,256);let finishSeed=29;for(let i=0;i<grain.data.length;i+=4){finishSeed=(finishSeed*1664525+1013904223)>>>0;const v=232+(finishSeed>>>24)/255*18;grain.data[i]=grain.data[i+1]=grain.data[i+2]=v;grain.data[i+3]=255;}mc.putImageData(grain,0,0);silver.roughnessMap=new T.CanvasTexture(machining);silver.roughnessMap.wrapS=silver.roughnessMap.wrapT=T.RepeatWrapping;silver.roughnessMap.repeat.set(8,8);
 const polished=new T.MeshStandardMaterial({color:0xe8e7e3,metalness:1,roughness:.16,envMapIntensity:1});
 silver.roughnessMap=null;
 // Cast grain uses object-space noise: imported shells have no dependable UVs.
 silver.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCastPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCastPoint = position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCastPoint;\nfloat castHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat castDetail = castHash(floor(vCastPoint*175.0));\nfloat castAA = 1.0-smoothstep(.3,1.6,length(fwidth(vCastPoint*175.0)));\nroughnessFactor = clamp(roughnessFactor + (castDetail-.5)*.13*castAA,.28,.44);\ndiffuseColor.rgb *= 1.0+(castDetail-.5)*.075*castAA;');shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal = normalize(normal + vec3(castDetail-.5,castHash(floor(vCastPoint*179.0))-.5,0.0)*.07*castAA);');};
 silver.customProgramCacheKey=()=> 'moka-cast-v3';
 const black=new T.MeshPhysicalMaterial({color:0x100d0b,roughness:.35,specularIntensity:.18});
 const brass=new T.MeshStandardMaterial({color:0xba9659,metalness:.88,roughness:.28});
 const brown=new T.MeshStandardMaterial({color:0x432515,roughness:.75});
 const blue=new T.MeshStandardMaterial({color:0x8aacb6,roughness:.3,transparent:true,opacity:.87});
 const glass=new T.MeshPhysicalMaterial({color:0xf2ece0,metalness:0,roughness:.075,transmission:.86,thickness:.035,ior:1.46,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide});
 const white=new T.MeshStandardMaterial({color:0xf1e7d6,roughness:.38});
 function mesh(group,geo,mat,x=0,y=0,z=0,action=''){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=!mat.transparent;o.receiveShadow=true;if(action)o.userData.action=action;group.add(o);return o;}
 function lathe(group,profile,mat,segments=64,action=''){return mesh(group,new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments),mat,0,0,0,action);}
 function tube(group,points,r,mat,action=''){return mesh(group,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false),mat,0,0,0,action);}
 const pot=new T.Group();scene.add(pot);
 const parts={};for(const part of ['lower','basket','filter','gasket','upper','lid']){const g=new T.Group();g.userData.part=part;g.userData.action=part;pot.add(g);parts[part]=g;}
 const upperUnit=new T.Group();pot.add(upperUnit);for(const p of ['upper','lid','filter','gasket'])upperUnit.add(parts[p]);
 const lidHinge=new T.Group();upperUnit.add(lidHinge);lidHinge.add(parts.lid);lidHinge.position.set(.70,2.85,0);parts.lid.position.set(-.70,-2.85,0);
 // Solid inner surfaces, including the bottom. Exterior still comes from the supplied Blender asset.
 lathe(parts.lower,[[0,.055],[.65,.055],[.65,.16],[.57,.95],[.49,1.21],[.49,1.34],[.52,1.34],[.52,1.19],[.60,.95],[.68,.08],[0,.08]],silver,8,'lower');
 lathe(parts.lower,[[.49,1.20],[.565,1.20],[.565,1.34],[.49,1.34]],silver,64,'lower');
 class Thread extends T.Curve{getPoint(t,v=new T.Vector3()){return v.set(.57*Math.cos(t*Math.PI*6),1.20+t*.13,.57*Math.sin(t*Math.PI*6));}}
 mesh(parts.lower,new T.TubeGeometry(new Thread(),144,.009,6,false),silver);
 const valve=mesh(parts.lower,new T.CylinderGeometry(.062,.062,.06,6),brass,.30,.92,.62,'lower');valve.rotation.x=Math.PI/2;
 mesh(parts.lower,new T.TorusGeometry(.036,.009,8,24),brass,.30,.92,.66);
 const vhole=mesh(parts.lower,new T.CylinderGeometry(.014,.014,.016,16),black,.30,.92,.67);vhole.rotation.x=Math.PI/2;
 lathe(parts.basket,[[.09,.24],[.09,.99],[.45,1.12],[.48,1.12],[.48,1.31],[.445,1.31],[.445,1.145],[.06,1.02],[.06,.24]],silver,64,'basket');
 const grounds=mesh(parts.basket,new T.CylinderGeometry(.441,.441,1,64),brown,0,1.16,0,'basket');
 const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;const gc=grainCanvas.getContext('2d');gc.fillStyle='#59361f';gc.fillRect(0,0,128,128);let seed=9;
 for(let i=0;i<1500;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128;seed=(seed*1664525+1013904223)>>>0;const y=seed%128;gc.fillStyle=i%2?'#382114':'#815331';gc.fillRect(x,y,1.5,1.5);}brown.map=new T.CanvasTexture(grainCanvas);brown.map.wrapS=brown.map.wrapT=T.RepeatWrapping;
 const powderParticles=new T.InstancedMesh(new T.IcosahedronGeometry(.012,0),brown,160),dummy=new T.Object3D();
 for(let i=0;i<160;i++){const a=i*2.399,r=.43*Math.sqrt(i/160);dummy.position.set(Math.sin(a)*r,1.30+(i%3)*.003,Math.cos(a)*r);dummy.scale.set(1,.4,1);dummy.updateMatrix();powderParticles.setMatrixAt(i,dummy.matrix);}parts.basket.add(powderParticles);
 mesh(parts.gasket,new T.TorusGeometry(.49,.032,12,64),black,0,1.35).rotation.x=Math.PI/2;
 const filterShape=new T.Shape();filterShape.absarc(0,0,.48,0,Math.PI*2,false);for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++)if(x*x+y*y<17){const hole=new T.Path();hole.absarc(x*.10,y*.10,.014,0,Math.PI*2,true);filterShape.holes.push(hole);}
 const filter=mesh(parts.filter,new T.ExtrudeGeometry(filterShape,{depth:.016,bevelEnabled:false,curveSegments:8}),silver,0,1.38);filter.rotation.x=-Math.PI/2;
 lathe(parts.upper,[[.54,1.61],[.80,2.79],[.82,2.79],[.57,1.60],[.54,1.61]],silver,8);
 mesh(parts.upper,new T.CylinderGeometry(.54,.54,.035,64),silver,0,1.62);
 lathe(parts.upper,[[.06,1.46],[.085,1.46],[.11,2.75],[.08,2.75]],silver,48);
 const handle=new T.Shape();handle.moveTo(.69,2.7);handle.lineTo(1.23,2.69);handle.quadraticCurveTo(1.35,2.69,1.42,2.57);handle.lineTo(1.62,2.25);handle.quadraticCurveTo(1.67,2.18,1.63,2.06);handle.lineTo(1.48,1.46);handle.quadraticCurveTo(1.46,1.36,1.35,1.35);handle.lineTo(1.11,1.36);handle.lineTo(1.07,1.54);handle.lineTo(1.29,1.56);handle.lineTo(1.45,2.18);handle.lineTo(1.20,2.46);handle.lineTo(.69,2.47);handle.closePath();
 mesh(parts.upper,new T.ExtrudeGeometry(handle,{depth:.15,bevelEnabled:true,bevelSize:.024,bevelThickness:.025,bevelSegments:3}),black,0,0,-.075,'handle');
 mesh(parts.upper,new T.BoxGeometry(.14,.14,.24),silver,.71,2.65);
 const rivet=mesh(parts.upper,new T.CylinderGeometry(.029,.029,.014,24),silver,.72,2.65,.132);rivet.rotation.x=Math.PI/2;
 lathe(parts.lid,[[0,2.99],[.1,2.99],[.15,3.23],[.13,3.26],[0,3.26]],black,8,'lidknob');
 const shells=[];
 const ready=new GLTFLoader().loadAsync('./assets/moka-live-v3.glb').then(gltf=>{gltf.scene.updateMatrixWorld(true);const items=[];gltf.scene.traverse(o=>{if(o.isMesh)items.push(o);});for(const o of items){const p=o.userData.part||o.parent.name;if(!parts[p]||o.name.includes('wood'))continue;o.geometry.applyMatrix4(o.matrixWorld);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.material=o.userData.finish==='polished'?polished:silver;o.castShadow=true;o.receiveShadow=true;o.userData.action=p;parts[p].add(o);if(['lower','upper'].includes(p))shells.push(o);}canvas.dataset.asset='moka-live-v3';});
 const water=mesh(parts.lower,new T.CylinderGeometry(.48,.60,1,64),blue,0,.4);
 const waterVertices=water.geometry.attributes.position,waterOriginal=waterVertices.array.slice();
 const collected=mesh(parts.upper,new T.CylinderGeometry(.72,.53,1,64),new T.MeshStandardMaterial({color:0x5e321c,roughness:.42,envMapIntensity:.35}),0,1.6);
 const collectedVertices=collected.geometry.attributes.position,collectedOriginal=collectedVertices.array.slice();
 const crumbs=new T.InstancedMesh(new T.IcosahedronGeometry(.024,0),brown,12);for(let i=0;i<12;i++){const a=i*2.4;dummy.position.set(.54*Math.sin(a),1.34,.54*Math.cos(a));dummy.updateMatrix();crumbs.setMatrixAt(i,dummy.matrix);}parts.lower.add(crumbs);
 const waterMark=mesh(parts.lower,new T.TorusGeometry(.49,.005,6,64),new T.MeshBasicMaterial({color:0xd8c7a5}),0,.87);waterMark.rotation.x=Math.PI/2;
 const shadowTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,5,64,64,64);g.addColorStop(0,'rgba(43,28,16,.23)');g.addColorStop(.5,'rgba(43,28,16,.1)');g.addColorStop(1,'rgba(43,28,16,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);})();
 function shadow(x,z,size=2){const o=mesh(scene,new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),x,.012,z);o.rotation.x=-Math.PI/2;return o;}
 const ground=mesh(scene,new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.14}),0,-.015,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;ground.receiveShadow=true;
 ground.visible=false;const ambience=createWorkshopAmbience(scene);
 const potShadow=shadow(0,0,2.6),cupShadow=shadow(-1.4,.7,1.7);shadow(1.8,0,2.6);
 const pad=new T.Group();scene.add(pad);mesh(pad,new T.CylinderGeometry(.86,.88,.035,64),new T.MeshStandardMaterial({color:0x806549,roughness:.98}),0,.008);mesh(pad,new T.TorusGeometry(.82,.008,8,64),new T.MeshStandardMaterial({color:0x806549,roughness:.98}),0,.033).rotation.x=Math.PI/2;
 const drainBowl=new T.Group();scene.add(drainBowl);lathe(drainBowl,[[0,.025],[.58,.025],[.69,.28],[.66,.30],[.54,.065],[0,.065]],white);drainBowl.position.set(-1,.015,.8);
 const stove=new T.Group();stove.position.x=1.8;scene.add(stove);mesh(stove,new T.BoxGeometry(2.05,.26,1.6),new T.MeshStandardMaterial({color:0x30251e,metalness:.3,roughness:.33}),0,.13);mesh(stove,new T.CylinderGeometry(.60,.60,.07,64),black,0,.28);
 for(let i=0;i<4;i++){const b=mesh(stove,new T.BoxGeometry(.10,.12,1.4),black,0,.36);b.rotation.y=i*Math.PI/2;}
 const dial=mesh(stove,new T.CylinderGeometry(.16,.16,.14,40),black,-.62,.13,.83,'heat');dial.rotation.x=Math.PI/2;
 const needle=mesh(dial,new T.BoxGeometry(.025,.18,.015),white,0,0,.08);
 const flame=new T.Group();stove.add(flame);for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const f=mesh(flame,new T.ConeGeometry(.035,.12,5),new T.MeshBasicMaterial({color:0x58aff2,transparent:true,opacity:.8}),Math.sin(a)*.48,.38,Math.cos(a)*.48);}
 function jug(name){const g=new T.Group();g.userData.action=name;lathe(g,[[0,.03],[.29,.03],[.36,.64],[.39,.71],[.36,.71],[.335,.65],[.265,.065],[0,.065]],silver,64,name);tube(g,[[.35,.63,0],[.65,.69,0],[.66,.25,0],[.36,.20,0]],.026,silver,name);const lip=new T.Shape();lip.moveTo(-.36,.56);lip.lineTo(-.60,.69);lip.lineTo(-.36,.72);lip.closePath();mesh(g,new T.ExtrudeGeometry(lip,{depth:.16,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2}),silver,0,0,-.08,name);return g;}
 const jugWater=jug('water'),jugMilk=jug('milk');scene.add(jugWater,jugMilk);
 mesh(jugWater,new T.CylinderGeometry(.32,.25,.4,48),blue,0,.26,0,'water');mesh(jugMilk,new T.CylinderGeometry(.32,.25,.4,48),new T.MeshStandardMaterial({color:0xf1e6d3,roughness:.5}),0,.26,0,'milk');
 const scoop=new T.Group();scoop.userData.action='powder';scene.add(scoop);mesh(scoop,new T.SphereGeometry(.23,24,12,0,Math.PI*2,0,Math.PI/2),silver,0,0,0,'powder').rotation.x=Math.PI;mesh(scoop,new T.BoxGeometry(.70,.035,.09),silver,.42,0,0,'powder');mesh(scoop,new T.CylinderGeometry(.195,.195,.026,32),brown,0,.015);
 const fallingGrains=new T.InstancedMesh(new T.IcosahedronGeometry(.017,0),brown,84);scene.add(fallingGrains);fallingGrains.frustumCulled=false;fallingGrains.visible=false;
 const brush=new T.Group();scene.add(brush);brush.userData.action='brush';mesh(brush,new T.BoxGeometry(.55,.09,.09),black,.22,0,0,'brush');mesh(brush,new T.BoxGeometry(.15,.12,.30),new T.MeshStandardMaterial({color:0xaa9067,roughness:.9}),-.13,-.06,0,'brush');
 const cup=new T.Group();scene.add(cup);lathe(cup,[[0,.04],[.40,.04],[.50,1.45],[.485,1.45],[.37,.10],[0,.10]],glass,64,'cup');
 for(const [r,y] of [[.493,1.45],[.393,.08]])mesh(cup,new T.TorusGeometry(r,.013,8,64),new T.MeshBasicMaterial({color:0xe7e2d9,transparent:true,opacity:.7}),0,y).rotation.x=Math.PI/2;
 mesh(cup,new T.CylinderGeometry(.78,.72,.045,64),white,0,.015);
 const drink=mesh(cup,new T.CylinderGeometry(.46,.37,1,64),new T.MeshStandardMaterial({color:0x4e2b17,roughness:.55,envMapIntensity:.25}),0,.3);
 const drinkVertices=drink.geometry.attributes.position,drinkOriginal=drinkVertices.array.slice();
 const ice=[];for(let i=0;i<5;i++){const o=mesh(cup,new T.BoxGeometry(.24,.19,.22),new T.MeshStandardMaterial({color:0xb9d5d5,transparent:true,opacity:.63,roughness:.18}),Math.sin(i*2.4)*.23,1,Math.cos(i*2.4)*.23);o.rotation.set(.12,i,.15);ice.push(o);}
 const iceTool=new T.Group();scene.add(iceTool);iceTool.userData.action='ice';for(const z of [-.1,.1])mesh(iceTool,new T.BoxGeometry(.035,.6,.035),silver,0,.25,z,'ice');mesh(iceTool,new T.BoxGeometry(.23,.20,.22),glass,0,-.1,0,'ice');
 const streamGeometry=new T.BufferGeometry(),streamPositions=new Float32Array(25*8*3),indices=[];
 for(let j=0;j<24;j++)for(let k=0;k<8;k++){const a=j*8+k,b=j*8+(k+1)%8,c=(j+1)*8+k,d=(j+1)*8+(k+1)%8;indices.push(a,b,c,b,d,c);}
 streamGeometry.setAttribute('position',new T.BufferAttribute(streamPositions,3));streamGeometry.setIndex(indices);const stream=mesh(scene,streamGeometry,new T.MeshStandardMaterial({color:0x99bdcb,transparent:true,opacity:.88,roughness:.3}));stream.frustumCulled=false;
 const ripples=[];for(let i=0;i<2;i++){const r=mesh(scene,new T.TorusGeometry(.18+i*.14,.006,6,48),new T.MeshBasicMaterial({color:0xf0e4ca,transparent:true,opacity:.45}));r.rotation.x=Math.PI/2;r.visible=false;ripples.push(r);}
 function drawStream(a,b,color,radius,time){stream.visible=true;stream.material.color.set(color);const v=new T.Vector3(),tangent=new T.Vector3(),normal=new T.Vector3(),binormal=new T.Vector3(),up=new T.Vector3(0,0,1),control=a.clone().lerp(b,.5);control.y=Math.max(a.y,b.y)*.72+Math.min(a.y,b.y)*.28;for(let j=0;j<25;j++){const t=j/24;v.copy(a).multiplyScalar((1-t)**2).addScaledVector(control,2*(1-t)*t).addScaledVector(b,t*t);tangent.copy(control).sub(a).multiplyScalar(2*(1-t)).addScaledVector(b.clone().sub(control),2*t).normalize();normal.crossVectors(tangent,up).normalize();binormal.crossVectors(tangent,normal).normalize();for(let k=0;k<8;k++){const angle=k/8*Math.PI*2,index=(j*8+k)*3;streamPositions[index]=v.x+radius*(normal.x*Math.cos(angle)+binormal.x*Math.sin(angle));streamPositions[index+1]=v.y+radius*(normal.y*Math.cos(angle)+binormal.y*Math.sin(angle));streamPositions[index+2]=v.z+radius*(normal.z*Math.cos(angle)+binormal.z*Math.sin(angle));}}streamGeometry.attributes.position.needsUpdate=true;streamGeometry.computeVertexNormals();ripples.forEach((r,i)=>{r.visible=true;r.position.copy(b);r.position.y+=.007;r.scale.setScalar(.75+((time*.6+i*.5)%1)*.65);r.material.opacity=.25;});}
 // Prebuilt sectional shells with closed radial cut surfaces, rather than pretending material clipping creates walls.
 const sectional=[];
 function section(group,profile){const pts=profile.map(p=>new T.Vector2(...p)),start=1.35,length=Math.PI*2-1.9;const body=mesh(group,new T.LatheGeometry(pts,48,start,length),silver);sectional.push(body);for(const angle of [start,start+length]){const shape=new T.Shape(pts);const cap=mesh(group,new T.ShapeGeometry(shape),silver);cap.rotation.y=Math.PI/2-angle;sectional.push(cap);}}
 section(parts.lower,[[.0,.025],[.735,.025],[.66,.95],[.54,1.34],[.49,1.34],[.49,1.20],[.61,.95],[.69,.10],[0,.10]]);
 section(parts.upper,[[.11,1.59],[.61,1.59],[.86,2.79],[.81,2.79],[.54,1.64],[.11,1.64],[.11,1.59]]);
 const arrows=new T.Group();pot.add(arrows);for(const y of [.48,1.19,2.19]){const arrow=new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(0,y,.17),.29,0x69aec8,.105,.075);arrows.add(arrow);}
 let size={width:0,height:0,ratio:0},mode='open',target=new T.Vector3(.3,1.5,0),desiredTarget=target.clone(),height=4.8,currentHeight=4.8,desiredHeight=4.8,eye=new T.Vector3(3.4,3.5,8),desiredEye=eye.clone(),activeTool='',preview='',gesture=null,dragPose=null,explosion=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function focus(next){mode=next;const presets={open:[.3,1.50,4.65,3.0,3.7,8],water:[0,.73,3.05,1.2,6.2,8],powder:[1.9,.95,2.35,1.0,7.6,7.0],brush:[1.9,.95,2.6,1.0,7.6,7.0],close:[.20,1.50,4.5,3,3.8,8],transport:[.75,1.5,5.3,3,3.5,8],heat:[1.8,1.8,5.7,2.2,7,8],pour:[-.05,1.4,4.7,2.6,4,8],milk:[.2,1.15,4.3,2.6,4.1,8],blend:[.2,1.15,4.3,2.6,4.1,8],structure:[.1,3.0,8.8,3.0,3.6,8]};const p=presets[next]||presets.open;desiredTarget.set(p[0],p[1],0);desiredHeight=p[2];desiredEye.set(p[3],p[4],p[5]);desiredTarget.z=next==='powder'||next==='brush'?-.3:0;}
 function resize(){const host=canvas.parentElement,w=host.clientWidth,h=host.clientHeight,r=Math.min(devicePixelRatio,2);if(w&&h&&(w!==size.width||h!==size.height||r!==size.ratio)){size={width:w,height:h,ratio:r};renderer.setPixelRatio(r);renderer.setSize(w,h,false);} }
 new ResizeObserver(resize).observe(canvas.parentElement);window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);resize();
 const ray=new T.Raycaster();
 function pick(x,y){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);for(const hit of ray.intersectObjects(scene.children,true)){let p=hit.object,visible=true,action='';while(p){if(!p.visible)visible=false;if(!action&&p.userData.action)action=p.userData.action;p=p.parent;}if(visible&&action)return {action,point:hit.point};}return null;}
 function project(o,local=new T.Vector3()){o.updateWorldMatrix(true,false);const p=o.localToWorld(local.clone()).project(camera);return {x:(p.x+1)/2*size.width,y:(1-p.y)/2*size.height};}
 function fadeTool(group,visible,dt){const next=typeof visible==='number'?visible:visible?1:0;group.userData.fade??=0;group.userData.fade+=(next-group.userData.fade)*(reduced?1:1-Math.exp(-dt*12));const alpha=group.userData.fade;group.visible=alpha>.005;group.traverse(o=>{if(!o.isMesh)return;if(!o.userData.fadeMaterials){o.userData.fadeMaterials=(Array.isArray(o.material)?o.material:[o.material]).map(m=>({material:Object.assign(m.clone(),{onBeforeCompile:m.onBeforeCompile,customProgramCacheKey:m.customProgramCacheKey}),opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}));o.material=Array.isArray(o.material)?o.userData.fadeMaterials.map(x=>x.material):o.userData.fadeMaterials[0].material;o.userData.baseShadow=o.castShadow;}for(const m of o.userData.fadeMaterials){m.material.opacity=m.opacity*alpha;m.material.transparent=m.transparent||alpha<.995;m.material.depthWrite=m.depthWrite&&alpha>.98;}o.castShadow=o.userData.baseShadow&&alpha>.98;});}
 function update(s,{tool='',view='',tilt=0,drag=null,flow='',time=0,dt=.016}={}){
  activeTool=tool;preview=view;dragPose=drag;ambience.update(mode,view,dt);
  const phaseBlend=['milk','blend'].includes(mode),phasePour=mode==='pour',phaseHeat=['heat','transport'].includes(mode);
  if(!gesture){const f=reduced?1:1-Math.exp(-dt*6);target.lerp(desiredTarget,f);height+=(desiredHeight-height)*f;eye.lerp(desiredEye,f);}
  const follow=reduced?1:1-Math.exp(-dt*10),aspect=Math.max(.1,size.width/Math.max(1,size.height)),minWidth={open:3.8,water:2.8,powder:2.65,brush:2.65,close:3.7,transport:4.6,heat:3.5,pour:4.6,milk:5.4,blend:5.4,structure:3.8}[mode]||3.8,fitHeight=Math.max(height,minWidth/aspect);currentHeight+=(fitHeight-currentHeight)*follow;const distance=currentHeight/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));camera.position.copy(target).addScaledVector(eye.clone().normalize(),distance);camera.lookAt(target);camera.aspect=aspect;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const potTarget=new T.Vector3(s.onStove?1.8:phaseBlend?-1.8:phasePour?.7:0,s.onStove?.41:phaseBlend?.01:0,phaseBlend?-.9:0);if(drag?.kind==='transport')potTarget.x+=drag.dx;
  if(view==='structure')potTarget.set(0,0,0);pot.position.lerp(potTarget,follow);const potScale=view==='structure'?1:phaseBlend?.54:phasePour?.82:1;pot.scale.setScalar(pot.scale.x+(potScale-pot.scale.x)*follow);pot.rotation.set(0,0,0);
  parts.lower.rotation.z=tool==='drain'?tilt*.75:0;parts.lower.position.y=tool==='drain'?Math.sin(tilt)*.36:0;
  if(tool==='coffee'&&phasePour){pot.rotation.z=tilt*.87;pot.position.y=.26+Math.sin(tilt)*.20;}
  explosion+=((view==='structure'?1:0)-explosion)*follow;const upperPose=upperPotPose(s.open);upperUnit.rotation.y=upperPose.rotation*(1-explosion);upperUnit.position.set(upperPose.x*(1-explosion),upperPose.y*(1-explosion)+2.55*explosion,upperPose.z*(1-explosion));upperUnit.scale.setScalar(1);
  const basketTarget=new T.Vector3(s.basketIn?0:1.9,s.basketIn?0:-.2,s.basketIn?0:-.3);if(drag?.kind==='basket'){basketTarget.x+=drag.dx;basketTarget.y+=drag.dy;}basketTarget.lerp(new T.Vector3(0,1.30,0),explosion);parts.basket.position.lerp(basketTarget,follow);parts.basket.rotation.z+=(((s.basketIn?0:-.08)*(1-explosion))-parts.basket.rotation.z)*follow;
  parts.gasket.position.y=-.95*explosion;parts.filter.position.y=-.63*explosion;
  lidHinge.position.set(.70,2.85,0);lidHinge.rotation.z=-(tool==='stir'?1:s.lidOpen||0)*1.25;
  lidHinge.position.y+=.70*explosion;lidHinge.rotation.z*=1-explosion;
  const focusedPreparation=!view&&['water','powder','brush'].includes(mode);
  fadeTool(upperUnit,!focusedPreparation,dt);fadeTool(parts.lower,!focusedPreparation||mode==='water',dt);fadeTool(parts.basket,!focusedPreparation||mode!=='water',dt);
  for(const o of shells)o.visible=view!=='flow';for(const o of sectional)o.visible=view==='flow';
  // Supplemental full liners are hidden in the cutaway, with only capped sectional shells left.
  parts.lower.children.slice(0,2).forEach(o=>o.visible=view!=='flow');parts.upper.children.slice(0,1).forEach(o=>o.visible=view!=='flow');
  arrows.visible=view==='flow';
  const remaining=Math.max(0,s.water-s.brewed),waterHeight=.10+remaining/SPEC.waterMax*.74;
  water.visible=s.water>0;water.scale.y=Math.max(.003,waterHeight-.10);water.position.y=.10+(waterHeight-.10)/2;water.rotation.z=-parts.lower.rotation.z;
  water.material.color.set('#8aacb6');waterMark.visible=s.open>.9&&['water','drain'].includes(tool);waterMark.material.color.set(s.water>SPEC.waterMax?'#bd6945':'#d8c7a5');
  for(let i=0;i<waterOriginal.length;i+=3)if(waterOriginal[i+1]>0)waterVertices.array[i+1]=waterOriginal[i+1]+Math.sin(time*4+waterOriginal[i]*7+waterOriginal[i+2]*5)*.003;waterVertices.needsUpdate=true;
  grounds.visible=s.powder>0;grounds.scale.y=Math.max(.002,s.powder/SPEC.powder*.17);grounds.position.y=1.14+s.powder/SPEC.powder*.085;
  powderParticles.visible=s.powder>.1;for(let i=0;i<160;i++){const a=i*2.399,r=.425*Math.sqrt(i/160);dummy.position.set(Math.sin(a)*r,1.14+s.powder/SPEC.powder*.17+(i%3)*.002,Math.cos(a)*r);dummy.scale.setScalar(s.grind===0?1.15:.7);dummy.scale.y*=.45;dummy.updateMatrix();powderParticles.setMatrixAt(i,dummy.matrix);}powderParticles.instanceMatrix.needsUpdate=true;brown.map.repeat.setScalar(s.grind===0?1.4:3.8);crumbs.count=Math.round(s.crumbs*12);
  const collectedHeight=coffeeLeft(s)/100*.85,collectedTop=1.64+collectedHeight;
  collected.visible=coffeeLeft(s)>0;collected.scale.setScalar(1);collected.position.set(0,0,0);
  // Intersect a level surface with the tapered octagonal cavity. The pool stays horizontal when the vessel tilts.
  const angle=pot.rotation.z,cs=Math.cos(angle),sn=Math.sin(angle),base=1.64;
  for(let i=0;i<collectedOriginal.length;i+=3){const top=collectedOriginal[i+1]>0,x=collectedOriginal[i],z=collectedOriginal[i+2],r=Math.hypot(x,z),a=Math.atan2(z,x),sector=((a%(Math.PI/4))+Math.PI/4)%(Math.PI/4)-Math.PI/8,facet=Math.cos(Math.PI/8)/Math.cos(sector);let y=base;if(top)y=r<.001?collectedTop:Math.max(base,Math.min(2.77,(cs*collectedTop-sn*Math.cos(a)*facet*(.53-.215*base))/(cs+sn*Math.cos(a)*facet*.215)));const radius=r<.001?0:(.53+(y-base)*.215)*facet;collectedVertices.array[i]=Math.cos(a)*radius;collectedVertices.array[i+1]=y;collectedVertices.array[i+2]=Math.sin(a)*radius;}collectedVertices.needsUpdate=true;collected.geometry.computeVertexNormals();
  stove.visible=phaseHeat;flame.visible=s.heat>0;flame.scale.y=.6+s.heat*.3;needle.rotation.z=-s.heat*.65;
  fadeTool(pad,!s.onStove&&!['powder','brush'].includes(mode),dt);pad.position.set(pot.position.x,0,pot.position.z);pad.scale.setScalar(phaseBlend?.74:1);potShadow.position.x=pot.position.x;potShadow.position.z=pot.position.z;potShadow.scale.setScalar(phaseBlend?.6:1);potShadow.visible=!['powder','brush'].includes(mode);fadeTool(drainBowl,tool==='drain',dt);
  fadeTool(jugWater,!view&&(mode==='water'&&tool!=='drain'||phaseBlend&&tool==='cupwater'),dt);fadeTool(jugMilk,!view&&phaseBlend&&tool==='milk',dt);fadeTool(brush,!view&&tool==='brush',dt);fadeTool(scoop,!view&&(['powder','brush'].includes(mode)||tool==='stir'),dt);fadeTool(iceTool,!view&&phaseBlend&&tool==='ice',dt);
  const lifting=Math.min(1,tilt/.25),waterLift=['water','cupwater'].includes(tool)?lifting:0,milkLift=tool==='milk'?lifting:0;
  jugWater.position.lerp(new T.Vector3(1.25-.70*waterLift,.02+1.78*waterLift,.20),follow);jugWater.rotation.z+=( (['water','cupwater'].includes(tool)?tilt*.90:0)-jugWater.rotation.z)*follow;
  jugMilk.position.lerp(new T.Vector3(1.65-.75*milkLift,.02+1.88*milkLift,.2),follow);jugMilk.rotation.z+=((tool==='milk'?tilt*.90:0)-jugMilk.rotation.z)*follow;
  const scoopLift=tool==='powder'?Math.min(1,tilt/.25):0;
  scoop.position.lerp(tool==='stir'?pot.localToWorld(new T.Vector3((drag?.dx||0),2.72,(drag?.dz||0))):new T.Vector3(2.85+((s.basketIn?.55:2.20)-2.85)*scoopLift,.23+1.29*scoopLift,.20),follow);scoop.rotation.z+=((tool==='powder'?-tilt*.7:0)-scoop.rotation.z)*follow;scoop.children[2].visible=tool!=='stir';
  brush.position.set(tool==='brush'?(s.basketIn?0:1.9)+(drag?.dx||0):2.5,tool==='brush'?1.42:.13,.20);brush.rotation.z=-.14;
  cup.visible=phaseBlend||phasePour;cup.position.set(phaseBlend?0:-1.4,0,.6);cupShadow.visible=cup.visible;cupShadow.position.x=cup.position.x;
  const amount=totalCup(s),level=.1+Math.min(amount,SPEC.cupMax)/SPEC.cupMax*1.23;
  drink.visible=amount>0;drink.scale.y=Math.max(.003,level-.1);drink.position.y=.1+(level-.1)/2;
  // Match the radius at each physical height of the tapered glass, including low fills.
  for(let i=0;i<drinkOriginal.length;i+=3){const top=drinkOriginal[i+1]>0,originalRadius=top?.46:.37,radius=.366+(top?level-.1:0)*.081,ratio=radius/originalRadius;drinkVertices.array[i]=drinkOriginal[i]*ratio;drinkVertices.array[i+2]=drinkOriginal[i+2]*ratio;}drinkVertices.needsUpdate=true;drink.geometry.computeVertexNormals();
  const c=new T.Color('#482718');c.lerp(new T.Color('#94704d'),s.cup.water/Math.max(1,amount-s.cup.ice)*.75).lerp(new T.Color('#eed6af'),s.cup.milk/Math.max(1,amount-s.cup.ice)*.92);drink.material.color.copy(c);
  ice.forEach((o,i)=>{o.visible=s.cup.ice>i*25;o.position.y=Math.min(1.35,Math.max(.2,level-.05));});iceTool.position.set(1.3,1.65,.20);if(drag?.kind==='ice'){iceTool.position.x+=drag.dx;iceTool.position.y+=drag.dy;}
  stream.visible=false;ripples.forEach(o=>o.visible=false);
  scene.updateMatrixWorld(true);
  if(flow==='water'){const a=jugWater.localToWorld(new T.Vector3(-.57,.69,0));drawStream(a,pot.localToWorld(new T.Vector3(0,waterHeight,0)),'#97bbcd',.025,time);}
  if(flow==='milk'){const a=jugMilk.localToWorld(new T.Vector3(-.57,.69,0));drawStream(a,cup.localToWorld(new T.Vector3(0,level,0)),'#efe3ce',.027,time);}
  if(flow==='cupwater'){const a=jugWater.localToWorld(new T.Vector3(-.57,.69,0));drawStream(a,cup.localToWorld(new T.Vector3(0,level,0)),'#a3bcc3',.025,time);}
  if(flow==='coffee'){const a=parts.upper.localToWorld(new T.Vector3(-.75,2.77,0));drawStream(a,cup.localToWorld(new T.Vector3(0,level,0)),'#603820',.024,time);}
  fallingGrains.visible=flow==='powder';if(fallingGrains.visible){const a=scoop.localToWorld(new T.Vector3(-.13,-.06,0)),b=parts.basket.localToWorld(new T.Vector3(0,1.14+s.powder/SPEC.powder*.17,0));for(let i=0;i<84;i++){const t=(time*2.4+i/84)%1;dummy.position.copy(a).lerp(b,t*t);dummy.position.x+=Math.sin(i*2.399)*.12*t;dummy.position.z+=Math.cos(i*2.399)*.12*t;dummy.rotation.set(i,time+i,i*.7);dummy.scale.setScalar(s.grind===0?1:.65);dummy.updateMatrix();fallingGrains.setMatrixAt(i,dummy.matrix);}fallingGrains.instanceMatrix.needsUpdate=true;}
  if(flow==='drain')drawStream(parts.lower.localToWorld(new T.Vector3(-.48,1.34,0)),new T.Vector3(-1,.1,.8),'#97bbcd',.024,time);
  if(!flow&&s.lastFlow>.08&&s.brewed>.5&&s.progress<1&&!view)drawStream(parts.upper.localToWorld(new T.Vector3(-.08,2.73,.02)),parts.upper.localToWorld(new T.Vector3(-.25,collectedTop,.05)),'#603820',.021,time);
  if(view==='flow'&&s.brewed>0){arrows.children.forEach((o,i)=>{o.position.y=[.48,1.19,2.19][i]+Math.sin(time*3+i)*.025;});}
  renderer.render(scene,camera);
 }
 return {ready,focus,update,pick,gesture(v){gesture=v;},project(action){const map={upper:[parts.upper,new T.Vector3(0,2.3,.45)],lower:[parts.lower,new T.Vector3(0,.6,.5)],filter:[parts.filter,new T.Vector3(0,1.38,.3)],gasket:[parts.gasket,new T.Vector3(0,1.35,.3)],lid:[parts.lid,new T.Vector3(0,3.10,0)],basket:[parts.basket,new T.Vector3(0,1.15,.1)],water:[jugWater,new T.Vector3(.15,.4,.1)],milk:[jugMilk,new T.Vector3(.15,.4,.1)],powder:[scoop,new T.Vector3(.2,0,0)],brush:[brush,new T.Vector3(.2,0,0)],heat:[dial,new T.Vector3()],handle:[parts.upper,new T.Vector3(1.45,2.10,0)],cup:[cup,new T.Vector3(0,.8,.5)],ice:[iceTool,new T.Vector3()]};const pair=map[action]||map.upper;return project(...pair);},layout:()=>({...size,height:currentHeight}),renderer,dispose(){renderer.dispose();env.dispose();}};
}
