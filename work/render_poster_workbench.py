"""Editable product assets for the HTML poster workbench; no baked UI."""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'poster-workbench'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED';scene.render.threads=10
scene.render.resolution_x=960;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.world=bpy.data.worlds.new('Warm studio environment')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.88,.85,.78,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
groups={name:[] for name in ['lower','basket','grounds','filter','gasket','upper','lid','burner','cup']}
def material(name,color,metal=0,rough=.3):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
silver=material('Satin cast aluminum',(.61,.64,.63),1,.38)
nodes=silver.node_tree.nodes;links=silver.node_tree.links
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=420
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.006
links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes['Principled BSDF'].inputs['Normal'])
polished=material('Machined aluminum collar',(.8,.82,.81),1,.18)
black=material('Matte bakelite',(.004,.003,.002),0,.52)
black.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.005
navy=material('Deep navy enamel',(.012,.025,.043),.55,.20)
brass=material('Brass safety valve',(.56,.32,.09),.85,.24)
rubber=material('Black silicone seal',(.024,.022,.019),0,.7)
white=material('Warm porcelain',(.93,.88,.79),0,.20)
coffee=material('Coffee surface',(.003,.0009,.00025),0,.38)
milk=material('Milk coffee surface',(.35,.19,.085),0,.33)
for liquid in [coffee,milk]:liquid.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.008
grounds=material('Ground coffee',(.013,.004,.0012),0,.90)
grounds.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.005
def finish(ob,mat,group,bevel=0):
    # Operators can inherit the active object's slots. Always assign slot zero.
    ob.data.materials.clear();ob.data.materials.append(mat);groups[group].append(ob)
    if bevel:
        mod=ob.modifiers.new('Manufactured edge bevel','BEVEL');mod.width=bevel;mod.segments=3
        norm=ob.modifiers.new('Weighted facet normals','WEIGHTED_NORMAL');norm.keep_sharp=True
    ob['component']=group
    return ob
def lathe(name,profile,mat,group,segments=64,bevel=0):
    vertices=[];faces=[]
    for r,z in profile:
        for i in range(segments):
            a=2*math.pi*i/segments+math.pi/8
            vertices.append((r*math.cos(a),r*math.sin(a),z))
    n=len(profile)
    for j in range(n):
        k=(j+1)%n
        for i in range(segments):
            q=(i+1)%segments
            faces.append((j*segments+i,j*segments+q,k*segments+q,k*segments+i))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    ob=bpy.data.objects.new(name,mesh);scene.collection.objects.link(ob)
    finish(ob,mat,group,bevel)
    if segments>16:
        for p in mesh.polygons:p.use_smooth=True
    return ob
def box(name,loc,scale,mat,group,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);ob=bpy.context.object;ob.name=name
    ob.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(ob,mat,group,bevel)
def cylinder(name,loc,r,depth,mat,group,vertices=64,rot=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc)
    ob=bpy.context.object;ob.name=name
    if rot:ob.rotation_euler=rot
    return finish(ob,mat,group,.008)
def tube(name,points,r,mat,group):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=4
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,v in zip(spline.bezier_points,points):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,curve);scene.collection.objects.link(ob);curve.materials.append(mat);groups[group].append(ob)
    return ob
# Pot dimensions are illustrative; matched axial parts remain separately editable.
base=.43
lower=lathe('Octagonal boiler',[(.74,base),(.58,1.57),(.58,1.65),(.52,1.65),(.52,1.57),(.68,base+.06),(.0001,base+.06),(.0001,base)],silver,'lower',8,.012)
lathe('Thread neck',[(.52,1.52),(.59,1.52),(.59,1.64),(.52,1.64)],polished,'lower',64,.003)
for z in [1.54,1.58,1.62]:
    lathe('Thread highlight',[(.59,z),(.603,z+.008),(.59,z+.016),(.58,z+.008)],polished,'lower',64)
valve=cylinder('Hexagonal brass valve',(.29,-.665,1.20),.080,.055,brass,'lower',6,(math.pi/2,0,0))
cylinder('Valve face',(.29,-.70,1.20),.052,.016,polished,'lower',48,(math.pi/2,0,0))
cylinder('Valve pin',(.29,-.715,1.20),.028,.018,black,'lower',32,(math.pi/2,0,0))
lathe('Funnel basket',[(.072,.68),(.072,1.34),(.50,1.49),(.52,1.49),(.52,1.64),(.48,1.64),(.48,1.51),(.048,1.36),(.048,.68)],polished,'basket',64,.004)
# Separate grounds used only in the preparation sprite.
ground=cylinder('Loose coffee bed',(0,0,1.55),.478,.11,grounds,'grounds')
lathe('Seal ring',[(.475,1.67),(.58,1.67),(.58,1.71),(.475,1.71)],rubber,'gasket',64)
filter=cylinder('Filter plate',(0,0,1.72),.49,.016,polished,'filter')
for x in range(-4,5):
    for y in range(-4,5):
        if x*x+y*y<16:
            cylinder('Filter perforation',(x*.09,y*.09,1.73),.012,.002,black,'filter',12)
lathe('Upper polished collar',[(.53,1.72),(.585,1.72),(.585,1.93),(.53,1.93)],polished,'upper',64,.005)
lathe('Octagonal collector',[(.58,1.92),(.88,3.18),(.91,3.18),(.62,1.92),(.08,1.92),(.08,1.88)],silver,'upper',8,.012)
lathe('Central coffee chimney',[(.05,1.90),(.09,1.90),(.095,3.03),(.06,3.03)],polished,'upper',64)
# Spout is part of the upper unit and does not create a second chimney.
verts=[(-.84,-.30,3.12),(-1.12,-.15,3.17),(-.86,.05,3.17),(-.84,-.30,3.04),(-1.12,-.15,3.10),(-.86,.05,3.09)]
mesh=bpy.data.meshes.new('Pouring lip');mesh.from_pydata(verts,[],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)]);mesh.update()
ob=bpy.data.objects.new('Pouring lip',mesh);scene.collection.objects.link(ob);finish(ob,silver,'upper',.012)
points=[(.79,3.09),(1.22,3.07),(1.50,2.66),(1.31,2.02),(1.11,2.01),(1.10,2.20),(1.23,2.20),(1.34,2.66),(1.12,2.89),(.79,2.90)]
vertices=[(x,y,z) for y in [-.08,.08] for x,z in points];n=len(points)
faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
mesh=bpy.data.meshes.new('Bakelite handle');mesh.from_pydata(vertices,[],faces);mesh.update()
ob=bpy.data.objects.new('Bakelite handle',mesh);scene.collection.objects.link(ob);finish(ob,black,'upper',.035)
box('Hinge bracket',(.83,0,3.07),(.14,.26,.15),polished,'upper',.015)
cylinder('Handle rivet',(.85,-.145,3.07),.038,.025,polished,'upper',32,(math.pi/2,0,0))
lathe('Octagonal lid',[(.0001,3.44),(.88,3.19),(.92,3.18),(.89,3.22),(.0001,3.47)],silver,'lid',8,.010)
lathe('Lid knob',[(.0001,3.46),(.12,3.46),(.19,3.70),(.16,3.75),(.0001,3.75)],black,'lid',8,.018)
# A compact burner modeled for this project; the HTML controls remain separate.
box('Navy enamel burner body',(0,0,.135),(2.65,1.95,.27),navy,'burner',.16)
cylinder('Burner black ring',(0,0,.30),.57,.08,black,'burner')
cylinder('Brushed burner cap',(0,0,.35),.43,.025,polished,'burner')
for i in range(4):
    a=i*math.pi/2
    support=box('Pot support',(math.sin(a)*.66,math.cos(a)*.66,.385),(.15,.92,.11),black,'burner',.015)
    support.rotation_euler.z=-a
cylinder('Stove front dial',(.8,-.99,.16),.12,.07,black,'burner',64,(math.pi/2,0,0))
box('Dial index',(.8,-1.03,.23),(.015,.01,.04),white,'burner',.002)
# Cup isolated as a second scene sprite, with identical lighting.
lathe('Porcelain cup',[(.0001,.04),(.34,.04),(.45,.18),(.56,1.01),(.565,1.08),(.52,1.08),(.51,.98),(.395,.18),(.0001,.18)],white,'cup',96,.008)
tube('Cup handle',[(.53,0,.89),(.77,0,.88),(.94,0,.68),(.91,0,.38),(.70,0,.25),(.43,0,.32)],.045,white,'cup')
lathe('Saucer',[(.0001,0),(.75,0),(.83,.05),(.78,.09),(.37,.04),(.0001,.04)],white,'cup',96,.006)
surface=cylinder('Drink surface',(0,0,.94),.508,.008,coffee,'cup',96)
bpy.ops.object.camera_add(location=(4.6,-8.5,5.1));cam=bpy.context.object;cam.name='Poster product camera'
def aim(target):
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=4.8;aim((.15,0,1.91));scene.camera=cam
def area(name,loc,power,size,color):
    bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.name=name
    lamp.data.energy=power;lamp.data.shape='DISK';lamp.data.size=size;lamp.data.color=color
    lamp.rotation_euler=(Vector((0,0,1.8))-lamp.location).to_track_quat('-Z','Y').to_euler()
area('Large soft window',(-3,-4,6),650,4,(1,.94,.84))
area('Narrow right reflection',(4,-1,4),420,3,(.87,.93,1))
area('Back rim reflection',(-1,4,5),700,3,(1,.93,.80))
from bpy_extras.object_utils import world_to_camera_view
def projected(point):
    bpy.context.view_layer.update();p=world_to_camera_view(scene,cam,Vector(point))
    return [round(p.x,6),round(1-p.y,6)]
anchors={'spout':projected((-1.12,-.15,3.17)),'burner':projected((0,0,.39)),'knob':projected((0,0,3.75))}
def show(names):
    for name,objects in groups.items():
        for ob in objects:ob.hide_render=name not in names
def render(name):
    scene.render.filepath=str(OUT/(name+'.png'))
    print('RENDER',name,flush=True);bpy.ops.render.render(write_still=True)
show(['lower','basket','filter','gasket','upper','lid','burner'])
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work'/'poster-workbench-v1.blend'))
render('closed-preview')
for name in ['lower','basket','grounds','filter','gasket','upper','lid','burner']:
    show([name]);render(name)
# Shared camera and framing for all product layers: CSS shifts cannot misalign parts.
scene.render.resolution_x=720;scene.render.resolution_y=720
cam.location=(3.8,-7,4.2);cam.data.ortho_scale=2.50;aim((.18,0,.50))
anchors['cupSurface']=projected((0,0,.94))
show(['cup']);surface.hide_render=True;render('cup-empty')
surface.hide_render=False
anchors['cupLevels']={}
for suffix,z in [('low',.38),('mid',.66),('high',.94)]:
    radius=.395+(z-.18)/.80*.115-.004
    surface.location.z=z;surface.scale.x=surface.scale.y=radius/.508
    anchors['cupLevels'][suffix]=projected((0,0,z))
    for color,mat in [('black',coffee),('milk',milk)]:
        surface.data.materials.clear();surface.data.materials.append(mat)
        render('cup-'+color+('-'+suffix if suffix!='high' else ''))
(OUT/'manifest.json').write_text(json.dumps({
    'generator':'work/render_poster_workbench.py','blend':'work/poster-workbench-v1.blend',
    'product_canvas':[960,1200],'cup_canvas':[720,720],'parts':['lower','basket','filter','gasket','upper','lid'],
    'renderer':'Blender Cycles 48 samples, shared orthographic camera and area lights',
    'anchors':anchors,
    'geometry':'Original illustrative modeling; not a measured replica or a calibrated physical interior',
    'license':'Project-created geometry and materials'
},indent=2),encoding='utf-8')
print('POSTER_ASSETS_COMPLETE',flush=True)
