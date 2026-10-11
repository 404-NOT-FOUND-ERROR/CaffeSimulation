"""Native Blender object plates for the approved coffee interface.
UI, liquid levels and all interactions stay in HTML / SVG; these are object renders.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/reference-room';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'work/hybrid-moka-v1.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED';scene.render.threads=12
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
world=bpy.data.worlds.new('Reference room soft reflections');world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.88,.85,.78,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22;scene.world=world
pot=[o for o in scene.objects if o.type=='MESH']
def mat(name,color,metal=0,rough=.25,transmission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 p.inputs['Transmission Weight'].default_value=transmission;p.inputs['IOR'].default_value=1.46
 return m
silver=mat('Reference turned aluminium',(.72,.73,.70),1,.23);dark=mat('Reference black bakelite',(.009,.007,.005),0,.35)
glass=mat('Clear glass',(.96,.97,.95),0,.06,1);coffee=mat('Dark brewed coffee',(.065,.019,.006),0,.24)
milk=mat('Fresh milk',(.91,.86,.73),0,.28);foam=mat('Soft white foam',(.95,.91,.82),0,.75);syrup=mat('Amber syrup',(.40,.16,.015),0,.19,.25)
ice=mat('Clear solid ice',(.80,.89,.91),0,.12,.72)
def area(name,pos,power,size,color=(1,.94,.82),size_y=None):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='RECTANGLE';data.size=size;data.size_y=size_y or size
 ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,1.8))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Large left window',(-4,-5,7),950,5, size_y=7);area('Narrow right reflector',(4,-2,4),550,2,(.89,.93,1),6);area('Top rim',(-1,4,6),900,4)
camera_data=bpy.data.cameras.new('Reference camera');cam=bpy.data.objects.new('Reference camera',camera_data);scene.collection.objects.link(cam);scene.camera=cam;camera_data.type='ORTHO'
all_objects=pot[:]
def box(name,loc,dim,material,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:m=o.modifiers.new('Soft manufactured edges','BEVEL');m.width=bevel;m.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 all_objects.append(o);return o
def cylinder(name,loc,r,depth,material):
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 all_objects.append(o);return o
def lathe(name,profile,material):
 vs=[(r*math.cos(i*math.tau/64),r*math.sin(i*math.tau/64),z) for r,z in profile for i in range(64)];n=len(profile)
 fs=[(j*64+i,j*64+(i+1)%64,((j+1)%n)*64+(i+1)%64,((j+1)%n)*64+i) for j in range(n) for i in range(64)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update();bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.data.materials.append(material)
 for p in mesh.polygons:p.use_smooth=True
 all_objects.append(o);return o
def tube(name,points,r,material):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=5
 s=curve.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for p,xyz in zip(s.bezier_points,points):p.co=xyz;p.handle_left_type=p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);curve.materials.append(material);all_objects.append(o);return o
cuts=[]
for original in pot:
 if not any(n in original.name for n in ['Octagonal boiler','Octagonal collector','Funnel basket']):continue
 o=original.copy();o.data=original.data.copy();scene.collection.objects.link(o);o.name='Section '+original.name;o.parent=None;o.matrix_world=original.matrix_world.copy()
 cutter=box('Section cutting tool',(0,-.76,2.05),(.98,1.6,3.5),silver,0)
 mod=o.modifiers.new('Open frontal section','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(cutter,do_unlink=True);all_objects.remove(cutter);cuts.append(o);all_objects.append(o)
cutnames={o.name.removeprefix('Section ') for o in cuts}
cutpot=[o for o in pot if o.name not in cutnames]+cuts
burner=[box('Stainless single stove',(0,0,.16),(2.1,1.55,.22),silver,.08),cylinder('Black burner',(0,0,.30),.56,.065,dark)]
for x in [-.63,.63]:burner.append(box('Pot support',(x,0,.36),(.12,1.05,.14),dark,.018))
burner.append(cylinder('Stove control',(-.65,-.80,.14),.12,.08,dark));burner[-1].rotation_euler=(math.pi/2,0,0)
grounds=cylinder('Visible loose coffee',(0,0,1.56),.46,.12,coffee)
manifest={}
def project(x,y,z):
 p=world_to_camera_view(scene,cam,Vector((x,y,z)));return [round(p.x*scene.render.resolution_x,3),round((1-p.y)*scene.render.resolution_y,3)]
def render(name,visible,size,scale,target,camera=(2,-12,4.2),points=None):
 for o in all_objects:o.hide_render=o not in visible
 cam.location=camera;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
 scene.render.resolution_x,scene.render.resolution_y=size;scene.render.resolution_percentage=100;bpy.context.view_layer.update()
 scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
 manifest[name]={'width':size[0],'height':size[1],'points':{k:project(*v) for k,v in (points or {}).items()}}
 print('REFERENCE_RENDER',name,flush=True)
tank={'baseLeft':(-.44,-.15,.50),'baseRight':(.44,-.15,.50),'topLeft':(-.42,-.15,1.47),'topRight':(.42,-.15,1.47),'levelLow':(0,-.15,.5),'levelHigh':(0,-.15,1.20),'valve':(.48,-.49,1.20)}
render('lower-section',[o for o in cutpot if o.get('part')=='lower'],(600,700),1.78,(0,0,1.06),camera=(2,-12,4.2),points=tank)
render('basket',[o for o in pot if o.get('part')=='basket'],(400,430),1.18,(0,0,1.17),camera=(2,-12,6),points={'rim':(0,0,1.64)})
brewpoints={**tank,'coffeeLow':(0,-.15,1.94),'coffeeHigh':(0,-.15,3.10),'upperLeft':(-.46,-.15,3.10),'upperRight':(.46,-.15,3.10),'upperBaseLeft':(-.44,-.15,1.94),'upperBaseRight':(.44,-.15,1.94),'pipeTop':(0,-.15,3.02),'pipeBase':(0,-.15,.68),'flame':(0,0,.40)}
render('brew-section',cutpot+burner+[grounds],(840,1100),4.10,(0,0,1.90),points=brewpoints)
# The source pot is also available in the quiet gazette corner.
render('closed-moka',pot,(600,850),3.90,(0,0,2.0))
# Ingredient object plates are low-resolution, matching the shared tray.
for kind in ['coffee','water','milk','foam','ice','syrup']:
 before=set(all_objects)
 if kind in ['coffee','water','milk','syrup']:
  lathe(kind+' vessel',[(.001,.03),(.31,.03),(.34,.1),(.38,1.0),(.355,1.0),(.31,.12),(.001,.12)],glass)
  if kind in ['water','milk']:tube('Glass jug handle',[(.36,0,.80),(.63,0,.83),(.69,0,.48),(.34,0,.35)],.039,glass)
  fluid={'coffee':coffee,'water':glass,'milk':milk,'syrup':syrup}[kind];cylinder('Ingredient liquid',(0,0,.36),.309,.46,fluid)
 else:
  lathe('Clear bowl',[(.001,.03),(.31,.03),(.52,.43),(.51,.46),(.48,.44),(.29,.09),(.001,.09)],glass if kind=='ice' else milk)
  for i in range(6):
   a=i*2.4;x=math.sin(a)*.22;y=math.cos(a)*.22
   if kind=='ice':o=box('Solid ice cube',(x,y,.40+(i%2)*.13),(.27,.25,.25),ice,.035);o.rotation_euler=(.1*i,.06*i,.6*i)
   else:bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.24,location=(x,y,.42+(i%2)*.07));o=bpy.context.object;o.scale=(1,1,.65);o.data.materials.append(foam);all_objects.append(o)
 new=[o for o in all_objects if o not in before];render('ingredient-'+kind,new,(360,360),1.45,(0,0,.5),camera=(3,-10,6))
(OUT/'objects.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(OUT/'object-geometry.mjs').write_text('export const OBJECTS='+json.dumps(manifest,separators=(',',':'))+';\n',encoding='utf-8')
print('REFERENCE_OBJECTS_COMPLETE',flush=True)
