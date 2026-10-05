from pathlib import Path
root=Path(__file__).resolve().parents[1];p=root/'workshop-scene.js';text=p.read_text(encoding='utf-8-sig')
changes=[
("import {upperPotPose}", "import {createWorkshopAmbience} from './workshop-ambience.js';\nimport {upperPotPose}"),
("renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08", "renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.22"),
("color:0x858687", "color:0xb5a99a"),
("new T.HemisphereLight(0xffffff,0x8b8176,.7)", "new T.HemisphereLight(0xfff7e8,0x735944,.65)"),
("new T.DirectionalLight(0xfffaf1,2.7)", "new T.DirectionalLight(0xffe4bd,2.9)"),
("key.position.set(-3,7,5)", "key.position.set(-3.5,7,5)"),
("key.shadow.radius=5;key.shadow.blurSamples=8", "key.shadow.radius=7;key.shadow.blurSamples=12"),
("new T.DirectionalLight(0xf0eeea,.5)", "new T.DirectionalLight(0xfff4dd,.38)"),
("color:0xe5e5e4,metalness:1,roughness:.25", "color:0xe2e3e1,metalness:1,roughness:.34"),
("const black=new T.MeshStandardMaterial({color:0x181a19,roughness:.42});", "const polished=new T.MeshStandardMaterial({color:0xe8e7e3,metalness:1,roughness:.16,envMapIntensity:1});\n silver.roughnessMap=null;\n // Cast grain uses object-space noise: imported shells have no dependable UVs.\n silver.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\\nvarying vec3 vCastPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\\nvCastPoint = position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\\nvarying vec3 vCastPoint;\\nfloat castHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\\nfloat castDetail = castHash(floor(vCastPoint*235.0));\\nfloat castAA = 1.0-smoothstep(.3,1.6,length(fwidth(vCastPoint*235.0)));\\nroughnessFactor = clamp(roughnessFactor + (castDetail-.5)*.13*castAA,.28,.44);\\ndiffuseColor.rgb *= 1.0+(castDetail-.5)*.055*castAA;');shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\\nnormal = normalize(normal + vec3(castDetail-.5,castHash(floor(vCastPoint*239.0))-.5,0.0)*.06*castAA);');};\n silver.customProgramCacheKey=()=> 'moka-cast-v3';\n const black=new T.MeshPhysicalMaterial({color:0x100d0b,roughness:.35,specularIntensity:.18});"),
("const ready=new GLTFLoader().loadAsync('./assets/moka-silver-v2.glb')", "const ready=new GLTFLoader().loadAsync('./assets/moka-live-v3.glb')"),
("o.material=silver;o.castShadow", "o.material=o.userData.finish==='polished'?polished:silver;o.castShadow"),
("canvas.dataset.asset='moka-silver-v2'", "canvas.dataset.asset='moka-live-v3'"),
("const potShadow=shadow", "ground.visible=false;const ambience=createWorkshopAmbience(scene);\n const potShadow=shadow"),
("color:0xe6ddcb,roughness:.86", "color:0xaa8151,roughness:.94"),
("mesh(stove,new T.BoxGeometry(2.05,.26,1.6),silver", "mesh(stove,new T.BoxGeometry(2.05,.26,1.6),new T.MeshStandardMaterial({color:0x30251e,metalness:.3,roughness:.33})"),
("material:m.clone(),opacity:m.opacity", "material:Object.assign(m.clone(),{onBeforeCompile:m.onBeforeCompile,customProgramCacheKey:m.customProgramCacheKey}),opacity:m.opacity"),
("activeTool=tool;preview=view;dragPose=drag;", "activeTool=tool;preview=view;dragPose=drag;ambience.update(mode,view,dt);"),
("scoop.position.lerp(new T.Vector3(tool==='stir'?.7+(drag?.dx||0):2.85+((s.basketIn?.55:2.20)-2.85)*scoopLift,tool==='stir'?2.5:.23+1.29*scoopLift,.20),follow);", "scoop.position.lerp(tool==='stir'?pot.localToWorld(new T.Vector3((drag?.dx||0),2.72,(drag?.dz||0))):new T.Vector3(2.85+((s.basketIn?.55:2.20)-2.85)*scoopLift,.23+1.29*scoopLift,.20),follow);"),
("if(!flow&&s.heat>0&&s.brewed>.5", "if(!flow&&s.lastFlow>.08&&s.brewed>.5"),
]
for before,after in changes:
 assert before in text, before[:100]
 text=text.replace(before,after,1)
p.write_text(text,encoding='utf-8')
