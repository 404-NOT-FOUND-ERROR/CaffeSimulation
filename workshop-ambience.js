import * as T from './vendor/three.module.js';

// All visible furniture is real scene geometry and shares the vessel's lights.
// No baked room image is stretched behind a camera that moves independently.
export function createWorkshopAmbience(scene){
 const group=new T.Group();scene.add(group);
 const grain=document.createElement('canvas');grain.width=grain.height=256;
 const ctx=grain.getContext('2d'),pixels=ctx.createImageData(256,256);let seed=19;
 for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=(seed>>>24)/255;pixels.data[i]=227+n*17;pixels.data[i+1]=215+n*15;pixels.data[i+2]=193+n*15;pixels.data[i+3]=255;}
 ctx.putImageData(pixels,0,0);const texture=new T.CanvasTexture(grain);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(7,4);
 const stone=new T.MeshStandardMaterial({color:0xf5e8cc,map:texture,bumpMap:texture,bumpScale:.009,roughness:.52});
 const edge=new T.MeshStandardMaterial({color:0x5d3a24,roughness:.65});
 function box(w,h,d,mat,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 const table=box(7.6,.085,4.05,stone,.5,-.060,-.6);
 box(7.6,.145,4.05,edge,.5,-.175,-.6);
 // Subtle oblique window mullion shadows, below all tools and live contact shadows.
 const shadeCanvas=document.createElement('canvas');shadeCanvas.width=shadeCanvas.height=512;const sc=shadeCanvas.getContext('2d');sc.translate(256,256);sc.rotate(-.38);sc.fillStyle='rgba(82,60,35,.10)';sc.fillRect(-7,-400,14,800);sc.fillRect(-400,-45,800,11);
 const shade=new T.Mesh(new T.PlaneGeometry(5.8,3.0),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadeCanvas),transparent:true,depthWrite:false,opacity:.55}));shade.rotation.x=-Math.PI/2;shade.position.set(.8,-.016,-.6);group.add(shade);
 function posterTexture(title,color){const c=document.createElement('canvas');c.width=384;c.height=512;const x=c.getContext('2d');x.fillStyle='#f0e4cc';x.fillRect(0,0,384,512);x.fillStyle=color;x.fillRect(20,20,344,472);x.fillStyle='#efe6d3';x.font='bold 65px Impact, sans-serif';x.save();x.translate(35,260);x.rotate(-.12);title.split('|').forEach((t,i)=>x.fillText(t,0,i*68));x.restore();x.font='15px sans-serif';x.fillText('OFFICINA DEL CAFFÈ',37,445);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
 const maps={prepare:posterTexture('PICCOLI|RITUALI','#9a6240'),heat:posterTexture('BUON|CAFFÈ','#a65032'),blend:posterTexture('LA TUA|TAZZA','#536c5a')};
 const wall=new T.Mesh(new T.PlaneGeometry(9,5),new T.MeshStandardMaterial({color:0xf2e8d8,roughness:1}));wall.position.set(.5,2.4,-2.65);wall.receiveShadow=true;group.add(wall);
 const cardMaterial=new T.MeshStandardMaterial({map:maps.prepare,roughness:.9});
 const card=new T.Mesh(new T.PlaneGeometry(1.4,1.9),cardMaterial);card.position.set(-1.9,1.35,-2.5);card.rotation.y=.1;group.add(card);
 const windowGroup=new T.Group();group.add(windowGroup);windowGroup.position.set(2.75,1.88,-2.55);
 const frame=new T.MeshStandardMaterial({color:0xe7d9bd,roughness:.65});
 const glazing=new T.MeshBasicMaterial({color:0xf4eee0});const panel=new T.Mesh(new T.PlaneGeometry(2.4,2.5),glazing);windowGroup.add(panel);
 for(const [w,h,x,y] of [[2.55,.055,0,1.27],[2.55,.08,0,-1.27],[.06,2.55,-1.24,0],[.06,2.55,1.24,0],[.045,2.5,-.25,0],[2.45,.035,0,-.15]]){const m=new T.Mesh(new T.BoxGeometry(w,h,.07),frame);m.position.set(x,y,.025);windowGroup.add(m);}
 // Distant flat silhouettes support the window; they never compete with the pot.
 for(let i=0;i<6;i++){const b=new T.Mesh(new T.PlaneGeometry(.34,.48+(i%3)*.16),new T.MeshBasicMaterial({color:i%2?0xe0c9a9:0xd4c4a5,transparent:true,opacity:.32}));b.position.set(-1.01+i*.39,-.92+(i%3)*.08,.006);windowGroup.add(b);}
 const jar=new T.Group();group.add(jar);jar.position.set(3.5,0,-1.4);
 const glass=new T.MeshPhysicalMaterial({color:0xdfd4b7,transparent:true,opacity:.22,roughness:.15,depthWrite:false});
 for(const [geo,mat,y] of [[new T.CylinderGeometry(.25,.25,.8,48),glass,.4],[new T.CylinderGeometry(.27,.27,.055,48),new T.MeshStandardMaterial({color:0x704627,metalness:.55,roughness:.4}),.84],[new T.CylinderGeometry(.21,.21,.56,48),new T.MeshStandardMaterial({color:0x472b18,roughness:.9}),.30]]){const m=new T.Mesh(geo,mat);m.position.y=y;m.castShadow=true;jar.add(m);}
 const beanMat=new T.MeshStandardMaterial({color:0x4e2c19,roughness:.55});
 for(let i=0;i<9;i++){const b=new T.Mesh(new T.SphereGeometry(.047,10,8),beanMat);b.scale.set(1,.45,.68);b.position.set(3.2+(i%3)*.12,.018,-.9+Math.floor(i/3)*.16);b.rotation.y=i*2.4;b.castShadow=true;group.add(b);}
 let active='';
 return {update(mode,view,dt){const phase=['heat','transport'].includes(mode)?'heat':['blend','milk','pour'].includes(mode)?'blend':'prepare';if(phase!==active){active=phase;cardMaterial.map=maps[phase];cardMaterial.needsUpdate=true;}group.visible=view!=='structure';card.visible=phase!=='prepare';wall.visible=phase!=='prepare';windowGroup.visible=phase!=='prepare';jar.visible=phase==='prepare';const c=new T.Color(phase==='heat'?0xf4ddbd:phase==='blend'?0xf8ead1:0xf5e8cc);table.material.color.lerp(c,1-Math.exp(-dt*2));}};
}
