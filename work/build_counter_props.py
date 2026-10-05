"""Small, art-directed cafe props for the homepage countertop; Blender 4.5+."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'cafe'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
jar=bpy.data.collections.new('Bean jar and green leaves');scene.collection.children.link(jar)
scatter=bpy.data.collections.new('Loose coffee beans');scene.collection.children.link(scatter)
rig=bpy.data.collections.new('Product studio');scene.collection.children.link(rig)
def move(obj,coll):
    for c in list(obj.users_collection):c.objects.unlink(obj)
    coll.objects.link(obj);return obj
def material(name,color,rough=.3,metal=0,trans=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal;p.inputs['Transmission Weight'].default_value=trans
    return m
glass=material('Soft clear glass',(.96,.93,.88),.065,trans=1)
glass.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.46
coffee=material('Roasted beans / satin brown',(.062,.027,.011),.45)
groove=material('Roasted bean crease',(.011,.005,.003),.7)
brass=material('Warm brushed lid',(.31,.16,.065),.36,.76)
paper=material('Espresso paper label',(.115,.053,.024),.76)
letter=material('Ivory label ink',(.75,.66,.48),.8)
green=material('Olive green leaves',(.085,.115,.042),.50)
stemmat=material('Dark green stems',(.038,.048,.021),.65)
def lathe(name,profile,mat,coll):
    n=80;verts=[];faces=[]
    for r,z in profile:
        for j in range(n):
            a=math.tau*j/n;verts.append((r*math.cos(a),r*math.sin(a),z))
    for i in range(len(profile)-1):
        for j in range(n):a=i*n+j;b=i*n+(j+1)%n;faces.append((a,b,b+n,a+n))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh);coll.objects.link(obj)
    for p in mesh.polygons:p.use_smooth=True
    return obj
def tube(name,points,radius,mat,coll):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=3
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type=p.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,curve);coll.objects.link(obj);curve.materials.append(mat);return obj
lathe('Glass bean jar',[(0,.02),(.42,.02),(.47,.09),(.47,1.18),(.44,1.31),(.35,1.36),(.35,1.51),(.32,1.51),(.32,1.38),(.405,1.29),(.435,1.18),(.435,.10),(0,.10)],glass,jar)
lathe('Brushed screw lid',[(0,1.53),(.375,1.53),(.39,1.55),(.39,1.63),(.36,1.67),(0,1.67)],brass,jar)
for z in [1.555,1.578,1.601]:lathe('Lid fine ring',[(.389,z),(.397,z+.008),(.389,z+.017)],brass,jar)
# The label follows the glass curvature, rather than float in front of the jar.
verts=[];faces=[]
for z in [.25,1.02]:
    for j in range(25):
        a=math.radians(-145+j*110/24);verts.append((.474*math.cos(a),.474*math.sin(a),z))
for j in range(24):faces.append((j,j+1,j+26,j+25))
mesh=bpy.data.meshes.new('Curved label');mesh.from_pydata(verts,[],faces);mesh.materials.append(paper)
o=bpy.data.objects.new('Curved paper label',mesh);jar.objects.link(o)
curve=bpy.data.curves.new('Label lettering','FONT');curve.body='UN CAFFÈ\nUNA STORIA';curve.align_x='CENTER';curve.size=.105;curve.space_line=1.25
o=bpy.data.objects.new('Label lettering',curve);jar.objects.link(o);o.location=(.025,-.485,.66);o.rotation_euler=(math.pi/2,0,0);curve.materials.append(letter)
# Model a bean with two rounded halves and a curved dark groove; use linked copies.
protos=[]
for y in [-.021,.021]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=1)
    o=bpy.context.object;o.scale=(.085,.038,.043);o.location.y=y;o.data.materials.append(coffee)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for p in o.data.polygons:p.use_smooth=True
    protos.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in protos:o.select_set(True)
bpy.context.view_layer.objects.active=protos[0];bpy.ops.object.join();proto=bpy.context.object;beanmesh=proto.data
bpy.data.objects.remove(proto,do_unlink=True)
rng=random.Random(29)
for layer in range(9):
    for j in range(14):
        a=rng.random()*math.tau;r=math.sqrt(rng.random())*.37
        obj=bpy.data.objects.new('Stored bean',beanmesh);jar.objects.link(obj)
        obj.location=(r*math.cos(a),r*math.sin(a),.16+layer*.11+rng.uniform(-.02,.02));obj.rotation_euler=(rng.random()*2,rng.random()*2,rng.random()*math.tau)
for i,(x,y) in enumerate([(-1.9,-.26),(-1.5,-.37),(-.8,.3),(-.4,-.27),(.15,.1),(.53,-.42),(.9,.25),(1.18,-.18),(1.45,.22),(1.72,-.28),(1.96,.12)]):
    obj=bpy.data.objects.new('Loose bean %02d'%i,beanmesh);scatter.objects.link(obj)
    obj.location=(x,y,.047);obj.rotation_euler=(.1*(i%2),-.12*(i%3),rng.random()*math.tau)
    obj.scale=(rng.uniform(.9,1.2),)*3
# A few leaves rise behind the jar and continue beyond the right edge of the scene.
tube('Plant main stem',[(.31,.43,.12),(.65,.45,1.9),(.89,.46,3.4)],.016,stemmat,jar)
for i,(root,length,angle) in enumerate([((.68,.43,2.08),.82,-1.1),((.78,.44,2.53),.78,.78),((.88,.45,3.00),.69,-.86),((.92,.45,3.23),.68,.61),((.57,.45,1.70),.7,-.85)]):
    vv=[];ff=[]
    for j in range(15):
        t=j/14;w=.22*math.sin(math.pi*t)**.8;z=length*t
        vv.extend([(-w,.055*math.sin(math.pi*t),z),(0,-.028*math.sin(math.pi*t),z),(w,.055*math.sin(math.pi*t),z)])
    for j in range(14):
        k=j*3;ff.extend([(k,k+3,k+4,k+1),(k+1,k+4,k+5,k+2)])
    me=bpy.data.meshes.new('Leaf blade');me.from_pydata(vv,[],ff);me.materials.append(green)
    obj=bpy.data.objects.new('Olive leaf %02d'%i,me);jar.objects.link(obj);obj.location=root;obj.rotation_euler=(.42,angle,.13*i)
    for p in me.polygons:p.use_smooth=True
    solid=obj.modifiers.new('Leaf thickness','SOLIDIFY');solid.thickness=.006
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.max_bounces=8
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='OPTIX'
    if any(d.type=='OPTIX' for d in prefs.devices):scene.cycles.device='GPU'
except Exception:pass
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.world=bpy.data.worlds.new('Neutral ambient');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.63,.61,.58,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.30
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
for name,pos,power,w,h in [('Broad key',(-3,-4,5),500,3.5,5),('Right fill',(4,-2,3.5),150,2.5,4),('Rim',(-2,3,5),280,2.5,4)]:
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='RECTANGLE';light.size=w;light.size_y=h
    obj=bpy.data.objects.new(name,light);rig.objects.link(obj);obj.location=pos;aim(obj,(0,0,1.4))
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
camera.location=(1.4,-8,3.8);aim(camera,(.25,.1,1.72));camera.data.ortho_scale=3.9
scene.render.resolution_x=600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scatter.hide_render=True;scene.render.filepath=str(OUT/'counter-jar.png')
print('RENDER jar and leaves',flush=True);bpy.ops.render.render(write_still=True)
jar.hide_render=True;scatter.hide_render=False
camera.location=(1.1,-6,5);aim(camera,(0,0,.04));camera.data.ortho_scale=4.75
scene.render.resolution_x=1120;scene.render.resolution_y=420;scene.render.filepath=str(OUT/'counter-beans.png')
print('RENDER loose beans',flush=True);bpy.ops.render.render(write_still=True)
jar.hide_render=False;scatter.hide_render=True;camera.location=(1.4,-8,3.8);aim(camera,(.25,.1,1.72));camera.data.ortho_scale=3.9
scene.render.resolution_x=600;scene.render.resolution_y=1000
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work'/'cafe-counter-props.blend'))
