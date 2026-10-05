"""A coherent cafe countertop: supplied Moka geometry, porcelain and shared warm light.

Blender 4.5+, --disable-autoexec. Source models remain untouched.
All props and their contact shadows/reflections are rendered in one scene.
"""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'cafe'
PREVIEW='--preview' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene

def mat(name,color,rough=.3,metal=0,trans=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal;p.inputs['Transmission Weight'].default_value=trans
    return m

def lathe(name,profile,material,segments=128):
    vv=[];ff=[]
    for r,z in profile:
        for j in range(segments):
            a=math.tau*j/segments;vv.append((r*math.cos(a),r*math.sin(a),z))
    for i in range(len(profile)-1):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments;ff.append((a,b,b+segments,a+segments))
    me=bpy.data.meshes.new(name);me.from_pydata(vv,[],ff);me.materials.append(material)
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o)
    for p in me.polygons:p.use_smooth=True
    return o

def tube(name,points,radius,material):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=24;cu.bevel_depth=radius;cu.bevel_resolution=5
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type=p.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,cu);scene.collection.objects.link(ob);cu.materials.append(material);return ob

def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()

# Load only the inspected exterior from the editable render copy.
with bpy.data.libraries.load(str(ROOT/'work'/'supplied-moka-studio.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n=='Coffee Pot Body']
moka=dst.objects[0];scene.collection.objects.link(moka);bpy.context.view_layer.update()
# Bake the saved object's metre scale before scene placement. Library loading does
# not evaluate matrix_world until the object is linked into an updated view layer.
world=moka.matrix_world.copy();bounds=[world@v.co for v in moka.data.vertices]
low=Vector([min(v[i] for v in bounds) for i in range(3)]);high=Vector([max(v[i] for v in bounds) for i in range(3)])
factor=3/(high.z-low.z);center=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z))
bake=Matrix.Scale(factor,4)@Matrix.Translation(-center)@world
moka.data.transform(bake);moka.matrix_world=Matrix.Translation((5.04,-.03,.035))@Matrix.Rotation(math.radians(-12),4,'Z')
for mod in moka.modifiers:
    if mod.type=='BEVEL':mod.width=.0024
moka.name='Moka / supplied exterior with refined materials'

silver=mat('Cast aluminium / bright warm silver',(.76,.775,.79),.31,1)
nt=silver.node_tree;p=nt.nodes.get('Principled BSDF')
tex=nt.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=420;tex.inputs['Detail'].default_value=2.2
coord=nt.nodes.new('ShaderNodeTexCoord');nt.links.new(coord.outputs['Object'],tex.inputs['Vector'])
tex.inputs['Scale'].default_value=135
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.27;bump.inputs['Distance'].default_value=.008
nt.links.new(tex.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
rough=nt.nodes.new('ShaderNodeMapRange');rough.inputs['From Min'].default_value=0;rough.inputs['From Max'].default_value=1
rough.inputs['To Min'].default_value=.24;rough.inputs['To Max'].default_value=.36
nt.links.new(tex.outputs['Fac'],rough.inputs['Value']);nt.links.new(rough.outputs['Result'],p.inputs['Roughness'])
tone=nt.nodes.new('ShaderNodeValToRGB');tone.color_ramp.elements[0].color=(.66,.69,.72,1);tone.color_ramp.elements[1].color=(.83,.85,.87,1)
nt.links.new(tex.outputs['Fac'],tone.inputs[0]);nt.links.new(tone.outputs[0],p.inputs['Base Color'])
trim=mat('Polished aluminium collar',(.86,.87,.89),.145,1)
black=mat('Bakelite / true warm black',(.009,.008,.007),.31)
black.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.065
black.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=0
brass=mat('Machined safety valve',(.66,.40,.105),.22,.92)
print('SOURCE MATERIALS',[m.name for m in moka.data.materials],flush=True)
for i,old in enumerate(moka.data.materials):
    name=old.name.lower()
    replacement=black if any(s in name for s in ['bakelite','blackgrip','blackglossy']) else brass if any(s in name for s in ['brass','metalbrushed']) else silver if any(s in name for s in ['cast aluminium','coffeepotbody']) else trim
    moka.material_slots[i].link='DATA';moka.material_slots[i].material=replacement
print('EFFECTIVE MATERIALS',[(s.link,s.material.name,list(s.material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value)) for s in moka.material_slots],flush=True)

# A small espresso cup and saucer, with closed ceramic walls and a real rolled rim.
porcelain=mat('Warm white glazed porcelain',(.95,.925,.875),.18)
pp=porcelain.node_tree.nodes.get('Principled BSDF');pp.inputs['Coat Weight'].default_value=.3;pp.inputs['Coat Roughness'].default_value=.12
coffee=mat('Black coffee / warm brown reflection',(.020,.007,.002),.29)
coffee.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.035
crema=mat('Coffee meniscus / thin amber edge',(.29,.10,.021),.35)
cup_parts=[]
cup_parts.append(lathe('Porcelain saucer',[(0,.02),(.62,.02),(.75,.055),(.87,.12),(.88,.15),(.86,.17),(.72,.14),(.40,.10),(.32,.10),(0,.10)],porcelain))
cup_parts.append(lathe('Porcelain espresso cup',[(0,.10),(.26,.10),(.29,.13),(.29,.18),(.33,.36),(.39,.66),(.43,.91),(.429,.933),(.411,.942),(.395,.93),(.37,.69),(.31,.39),(.24,.20),(0,.20)],porcelain))
cup_parts.append(tube('Porcelain cup handle',[(.412,0,.81),(.67,0,.85),(.72,0,.57),(.37,0,.37)],.044,porcelain))
cup_parts.append(lathe('Coffee surface',[(0,.22),(.245,.22),(.36,.74),(.376,.84),(0,.84)],coffee))
cup_parts.append(lathe('Coffee meniscus',[(.369,.839),(.376,.842),(.379,.847),(.375,.852),(.370,.849)],crema))
for o in cup_parts:o.location+=(Vector((2.85,-.20,.035)));o.rotation_euler.z=math.radians(-8);o.scale*=1.17
# A little real lettering on the front porcelain, not a floating HTML label.
ink=mat('Espresso brown cup stamp',(.04,.017,.007),.48)
for i,ch in enumerate('CAFFÈ'):
    font=bpy.data.curves.new('CAFFÈ ceramic stamp / '+ch,'FONT');font.body=ch;font.size=.125;font.align_x='CENTER';font.extrude=.0001
    if Path('C:/Windows/Fonts/impact.ttf').exists():font.font=bpy.data.fonts.load('C:/Windows/Fonts/impact.ttf')
    stamp=bpy.data.objects.new('CAFFÈ curved ceramic stamp / %d'%i,font);scene.collection.objects.link(stamp);font.materials.append(ink)
    angle=(i-2)*.16
    stamp.location=(2.85+.420*math.sin(angle),-.20-.420*math.cos(angle),.59)
    stamp.rotation_euler=(math.radians(103),0,angle)

# Use the existing editable native jar, linked bean meshes, and olive leaves in this light rig.
with bpy.data.libraries.load(str(ROOT/'work'/'cafe-counter-props.blend'),link=False) as (src,dst):
    dst.collections=[n for n in src.collections if n in {'Bean jar and green leaves','Loose coffee beans'}]
for c in dst.collections:
    scene.collection.children.link(c);c.hide_render=False
    for o in c.objects:
        if c.name.startswith('Bean jar'):
            plant=o.name.startswith(('Olive leaf','Plant main stem'))
            o.location=Vector((6.36 if plant else 6.92,.20,.035))+o.location*1.23;o.scale*=1.23
        else:
            o.location.x=4.30+o.location.x*1.3;o.location.y=-.35+o.location.y*.45
            o.location.z=.09;o.scale*=1.18

# One actual stone slab: reflections, soft shadows and a faceted espresso-brown fascia.
stone=mat('Honed warm ivory limestone',(.84,.775,.65),.37)
nt=stone.node_tree;p=nt.nodes.get('Principled BSDF');p.inputs['Specular IOR Level'].default_value=.32
coord=nt.nodes.new('ShaderNodeTexCoord');mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(.43,2.2,1)
noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.1;noise.inputs['Detail'].default_value=5;noise.inputs['Roughness'].default_value=.72
nt.links.new(coord.outputs['Generated'],mapping.inputs[0]);nt.links.new(mapping.outputs[0],noise.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.2;ramp.color_ramp.elements[0].color=(.90,.72,.49,1)
ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(1,.90,.69,1)
nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
fine=nt.nodes.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=190;nt.links.new(coord.outputs['Generated'],fine.inputs['Vector'])
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.1;bump.inputs['Distance'].default_value=.003
nt.links.new(fine.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
wood=mat('Deep espresso counter fascia',(.030,.014,.007),.7)
wood.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.1
nv=[(-10,1.25,0),(10,3.1,0),(10,.10,0),(2.75,-1.30,0),(-10,.50,0)]
verts=nv+[(x,y,-2.7) for x,y,z in nv]
faces=[(0,4,3,2,1),(5,6,7,8,9)]+[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]
me=bpy.data.meshes.new('Solid cafe countertop');me.from_pydata(verts,[],faces);me.materials.append(stone);me.materials.append(wood)
table=bpy.data.objects.new('Ivory stone countertop and dark front',me);scene.collection.objects.link(table)
for face in me.polygons:face.material_index=0 if face.index==0 else 1
bevel=table.modifiers.new('Fine polished slab edges','BEVEL');bevel.width=.008;bevel.segments=3
# A restrained pale edge separates the surface from the dark front.
# The fine geometry bevel supplies the lip; no redundant raised stripe.

scene.render.engine='CYCLES';scene.cycles.samples=64 if PREVIEW else 192;scene.cycles.use_denoising=True
scene.cycles.max_bounces=12;scene.cycles.transmission_bounces=10;scene.cycles.transparent_max_bounces=12
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='OPTIX'
    if any(d.type=='OPTIX' for d in prefs.devices):scene.cycles.device='GPU'
except Exception:pass
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.16
scene.world=bpy.data.worlds.new('Warm cream cafe bounce');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.91,.865,.75,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
for name,pos,power,w,h,color in [
    ('Large cafe window / upper left',(-3,-5,8),900,5,5,(1,.90,.75)),
    ('Broad reflected daylight / right',(8,-1,5),180,3,5,(1,.965,.90)),
    ('Soft rear edge / white linen',(3,4,6),450,4,4,(1,.96,.86))]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE';data.size=w;data.size_y=h;data.color=color
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos;aim(obj,(4,0,1.2))
# Bright low vertical reflections make the aluminium read as cast metal, not grey paint.
for name,pos,w,h,strength in [('Wide window reflection',(1,-5,2.3),1.8,6,1.1),('White linen reflection',(8,-4,2.0),1.2,5,.7)]:
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();em=n.new('ShaderNodeEmission')
    em.inputs[0].default_value=(1,.98,.94,1);em.inputs[1].default_value=strength
    out=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
    bpy.ops.mesh.primitive_plane_add(size=1,location=pos);ob=bpy.context.object;ob.name=name;ob.scale=(w,h,1)
    ob.rotation_euler=(Vector((5,0,1.6))-ob.location).to_track_quat('Z','Y').to_euler();ob.data.materials.append(m)
    ob.visible_camera=False;ob.visible_shadow=False;ob.visible_diffuse=False;ob.visible_transmission=False

flagmat=mat('Soft grey negative fill / metal facet contrast',(.32,.30,.27),1)
bpy.ops.mesh.primitive_plane_add(size=1,location=(4.2,-4,2.2));flag=bpy.context.object;flag.name='Narrow soft reflection contrast'
flag.scale=(.65,5,1);flag.rotation_euler=(Vector((5,0,1.6))-flag.location).to_track_quat('Z','Y').to_euler();flag.data.materials.append(flagmat)
flag.visible_camera=False;flag.visible_shadow=False;flag.visible_diffuse=False;flag.visible_transmission=False

bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO'
camera.location=(0,-14,7);aim(camera,(0,0,1.60));camera.data.ortho_scale=14
# Landscape ORTHO scale is the frame width; 14 world units across, 4.94 high.
scene.render.resolution_x=1586 if PREVIEW else 2379;scene.render.resolution_y=560 if PREVIEW else 840;scene.render.resolution_percentage=100
scene.render.filepath=str(OUT/('foreground-v3-preview.png' if PREVIEW else 'foreground-v3.png'))
bpy.context.preferences.filepaths.save_version=0
if not PREVIEW:
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work'/'cafe-foreground-v3.blend'))
print('CAFE_FOREGROUND render',scene.render.filepath,flush=True)
bpy.ops.render.render(write_still=True)
manifest={'blender':bpy.app.version_string,'source':'work/supplied-moka-studio.blend','scene':'work/cafe-foreground-v3.blend','output':scene.render.filepath,'camera':list(camera.location),'width':14,'color':'AgX / warm daylight / exposure 0.16','samples':scene.cycles.samples}
manifest['projected_moka_bounds']=[[float(x) for x in world_to_camera_view(scene,camera,moka.matrix_world@Vector(v))] for v in moka.bound_box]
(OUT/'foreground-v3-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
