"""Coffee studio product assets; Blender 3.1, editable source and transparent renders.
Run: blender -b --factory-startup --python-exit-code 1 --python work/build_cafe_assets.py
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "cafe"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name, color, rough=.3, metal=0, transmission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value=(*color,1)
    p.inputs["Roughness"].default_value=rough
    p.inputs["Metallic"].default_value=metal
    p.inputs["Transmission"].default_value=transmission
    p.inputs["IOR"].default_value=1.46 if transmission else 1.5
    return m

silver=material("Aluminium / neutral satin",(.78,.79,.80),.24,1)
nodes=silver.node_tree.nodes; links=silver.node_tree.links
noise=nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value=210
bump=nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value=.09; bump.inputs["Distance"].default_value=.0012
links.new(noise.outputs["Fac"],bump.inputs["Height"]); links.new(bump.outputs["Normal"],nodes.get("Principled BSDF").inputs["Normal"])
black=material("Bakelite / satin charcoal",(.008,.007,.006),.44)
black.node_tree.nodes.get("Principled BSDF").inputs["Specular"].default_value=.06
brass=material("Valve / brushed brass",(.57,.37,.13),.26,.86)
white=material("Porcelain / warm ivory",(.88,.84,.76),.19)
enamel=material("Espresso enamel",(.074,.039,.025),.23,.16)
glass=material("Borosilicate",(.96,.98,1),.055,0,1)
paper=material("Filter paper",(.76,.61,.39),.85)
ground=material("Ground coffee",(.065,.029,.014),.91)
gn=ground.node_tree.nodes; gl=ground.node_tree.links
gr=gn.new("ShaderNodeTexNoise");gr.inputs["Scale"].default_value=180
gb=gn.new("ShaderNodeBump");gb.inputs["Strength"].default_value=.55;gb.inputs["Distance"].default_value=.018
gl.new(gr.outputs['Fac'],gb.inputs['Height']);gl.new(gb.outputs['Normal'],gn.get('Principled BSDF').inputs['Normal'])
coffee=material("Black coffee",(.038,.013,.006),.20)
milk=material("Milk coffee",(.45,.28,.16),.22)
water=material("Iced coffee",(.10,.032,.01),.13,0,.16)

collections={}
for name in ["moka","pour","espresso","cup-black","cup-milk","cup-ice"]:
    c=bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c); collections[name]=c
def move(o,coll):
    for c in list(o.users_collection): c.objects.unlink(o)
    coll.objects.link(o)
    return o
def mesh(name, verts, faces, mat, coll):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    o=bpy.data.objects.new(name,me); coll.objects.link(o); me.materials.append(mat)
    return o
def finish(o, bevel=0, smooth=True):
    if bevel:
        o.data.use_auto_smooth=True
        b=o.modifiers.new("Small manufactured edge", "BEVEL"); b.width=bevel; b.segments=3
        b.limit_method='ANGLE'
        n=o.modifiers.new("Weighted highlights","WEIGHTED_NORMAL"); n.keep_sharp=True
    if smooth:
        for p in o.data.polygons: p.use_smooth=True
    return o
def lathe(name, profile, mat, coll, segments=96):
    vv=[]; ff=[]
    for r,z in profile:
        for j in range(segments):
            a=2*math.pi*j/segments; vv.append((r*math.cos(a),r*math.sin(a),z))
    for i in range(len(profile)-1):
        for j in range(segments):
            k=(j+1)%segments; ff.append((i*segments+j,i*segments+k,(i+1)*segments+k,(i+1)*segments+j))
    return finish(mesh(name,vv,ff,mat,coll),smooth=True)
def box(name, loc, size, mat, coll, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); move(o,coll); o.data.materials.append(mat)
    return finish(o,bevel)
def cylinder(name, loc, radius, depth, mat, coll, vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object; o.name=name; move(o,coll); o.data.materials.append(mat); return finish(o,.006)
def tube(name, points, radius, mat, coll):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.resolution_u=16
    data.bevel_depth=radius; data.bevel_resolution=4
    spline=data.splines.new("BEZIER"); spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points): p.co=co; p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,data); coll.objects.link(o); data.materials.append(mat); return o

# Refine the user's existing exterior rather than replace its silhouette.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets'/'moka-refined.glb'))
original=[o for o in bpy.context.scene.objects if o.type=="MESH"]
shells=[]
for o in original:
    o.data.materials.clear(); o.data.materials.append(black if "wood" in o.name else silver)
    if "wood" not in o.name:
        shells.append(o)
        finish(o,.006,False)
    else: finish(o,.012,True)
    move(o,collections["moka"])
# Export only the existing named exterior meshes; the live scene supplies its teaching internals.
bpy.ops.object.select_all(action='DESELECT')
for o in original: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets'/'moka-silver-v2.glb'),
    export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
m=collections["moka"]
for o in original:
    if o.name=='wood-knob':o.hide_render=True
lathe('Refined bakelite lid knob',[(0,2.978),(.086,2.978),(.105,3.015),(.158,3.20),(.148,3.25),(0,3.25)],black,m,8)
v=cylinder("Brass safety valve",(.26,-.73,.87),.064,.065,brass,m,6); v.rotation_euler.x=math.pi/2
v=cylinder("Valve aperture",(.26,-.771,.87),.020,.012,black,m); v.rotation_euler.x=math.pi/2
# Glass server with a real closed wall and a ceramic filter.
p=collections["pour"]
lathe("Server",[(0,.04),(.56,.04),(.64,.12),(.71,.30),(.64,.72),(.43,1.23),(.40,1.35),(.39,1.40),(.35,1.40),(.36,1.27),(.60,.70),(.67,.30),(.60,.14),(0,.12)],glass,p)
tube("Glass handle",[(.43,0,1.27),(.92,0,1.24),(1.03,0,.72),(.71,0,.43)],.04,glass,p)
lathe("Coffee in server",[(0,.13),(.58,.13),(.65,.30),(.64,.58),(0,.58)],coffee,p)
lathe("Ceramic dripper",[(.21,1.47),(.23,1.44),(.61,2.12),(.61,2.16),(.58,2.17),(.19,1.51)],white,p)
lathe("Ceramic resting ring",[(.21,1.40),(.59,1.40),(.59,1.45),(.21,1.45)],white,p)
tube("Dripper handle",[(.53,0,2.03),(.87,0,2.00),(.86,0,1.71),(.36,0,1.69)],.052,white,p)
lathe("Filter paper",[(.18,1.53),(.65,2.22),(.65,2.24),(.18,1.55)],paper,p)
lathe("Grounds",[(0,1.95),(.47,1.95),(.50,2.06),(0,2.06)],ground,p)
for i in range(160):
    a=i*2.399963;r=.47*math.sqrt((i+.5)/160)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.013,location=(r*math.cos(a),r*math.sin(a),2.065+(i%4)*.002))
    grain=bpy.context.object;grain.name='Individual coffee grounds';grain.scale=(1,.65,.5);grain.data.materials.append(ground);move(grain,p)
for i in range(18):
    a=i*math.tau/18
    tube("Ceramic rib",[(.25*math.cos(a),.25*math.sin(a),1.51),(.55*math.cos(a),.55*math.sin(a),2.05)],.012,white,p)

def cup(coll,liquid):
    lathe("Saucer",[(0,.03),(.64,.03),(.74,.07),(.77,.11),(.76,.14),(.50,.14),(.31,.10),(0,.10)],white,coll)
    lathe("Porcelain cup",[(0,.12),(.26,.12),(.28,.16),(.35,.50),(.41,.79),(.405,.815),(.375,.815),(.32,.51),(.25,.19),(0,.19)],white,coll)
    tube("Cup handle",[(.37,0,.72),(.63,0,.75),(.66,0,.46),(.31,0,.32)],.041,white,coll)
    lathe("Drink",[(0,.20),(.25,.20),(.345,.69),(0,.69)],liquid,coll)
cup(collections["cup-black"],coffee);cup(collections["cup-milk"],milk)
ice=collections["cup-ice"]
lathe("Tall iced glass",[(0,.02),(.32,.02),(.35,.04),(.40,1.25),(.38,1.27),(.36,1.26),(.31,.08),(0,.08)],glass,ice)
lathe("Iced drink",[(0,.09),(.31,.09),(.35,.91),(0,.91)],water,ice)
for i,(x,y,z) in enumerate([(-.12,.08,.75),(.10,-.07,.86),(0,.1,.99)]):
    q=box("Ice cube", (x,y,z),(.23,.23,.23),glass,ice,.028);q.rotation_euler=(.1*i,.12*i,.5*i)
e=collections["espresso"]
box("Rounded enamel body",(0,.18,1.30),(1.64,.74,2.45),enamel,e,.14)
box("Machine foot",(0,-.26,.09),(1.72,1.53,.18),enamel,e,.07)
box("Drip tray",(0,-.53,.25),(1.45,.88,.09),silver,e,.035)
box("Control band",(0,-.20,2.32),(1.62,.95,.50),enamel,e,.09)
box("Top silver trim",(0,-.18,2.60),(1.56,.90,.05),silver,e,.025)
head=cylinder("Group head",(0,-.48,1.86),.29,.28,silver,e)
cylinder("Filter holder",(0,-.48,1.67),.32,.13,silver,e)
handle=cylinder("Portafilter handle",(-.43,-.80,1.64),.07,.98,black,e);handle.rotation_euler=(0,math.pi/2,-.44)
knob=cylinder("Control dial",(.50,-.709,2.34),.096,.06,black,e);knob.rotation_euler.x=math.pi/2
tube("Steam wand",[(.67,-.30,1.96),(.85,-.62,1.75),(.85,-.65,.79)],.035,silver,e)
for x in range(9):box("Tray slot",((x-4)*.13,-.56,.304),(.033,.63,.014),black,e,.005)
small=bpy.data.collections.new("Machine cup");bpy.context.scene.collection.children.link(small);cup(small,coffee)
for o in list(small.objects):
    o.scale=(.72,)*3; o.location.y=-.54; o.location.z=.30; move(o,e)
bpy.data.collections.remove(small)

scene=bpy.context.scene
scene.render.engine="CYCLES";scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.cycles.max_bounces=8;scene.cycles.transparent_max_bounces=8
device="CPU"
try:
    prefs=bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type="OPTIX";prefs.get_devices()
    gpu=[d for d in prefs.devices if d.type!="CPU"]
    if gpu:
        for d in prefs.devices:d.use=d.type!="CPU"
        scene.cycles.device="GPU";device="OPTIX"
except Exception: pass
scene.render.film_transparent=True
scene.render.image_settings.file_format="PNG";scene.render.image_settings.color_mode="RGBA"
scene.view_settings.view_transform="Filmic";scene.view_settings.look="Medium High Contrast"
scene.view_settings.exposure=.3;scene.view_settings.gamma=1
scene.world=bpy.data.worlds.new("Neutral product studio");scene.world.use_nodes=True
scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.62,.64,.66,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value=.45
rig=bpy.data.collections.new("Studio lights");scene.collection.children.link(rig)
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat("-Z","Y").to_euler()
for name,pos,energy,w,h in [
    ("Broad left softbox",(-3,-4,3),480,2.3,5),
    ("Right fill",(4,-2,2.5),240,1.6,4.5),
    ("Rear rim",(-2,3,5),350,3,4)]:
    data=bpy.data.lights.new(name,"AREA");data.energy=energy;data.shape="RECTANGLE";data.size=w;data.size_y=h
    o=bpy.data.objects.new(name,data);rig.objects.link(o);o.location=pos;aim(o,(0,0,1.5))
flag=box("Black studio flag",(-3,1,1.8),(.05,2,4),black,rig,0)
# Low vertical cards reflect in the front facets. They are hidden only to the camera.
for name,pos,width,height,strength in [
    ('Tall silver reflection',(-2,-4,1.7),1.2,5,2.6),
    ('Narrow right reflection',(3,-3,1.7),.7,4,1.8)]:
    cardmat=bpy.data.materials.new(name);cardmat.use_nodes=True
    nt=cardmat.node_tree;nt.nodes.clear()
    emission=nt.nodes.new('ShaderNodeEmission');emission.inputs['Color'].default_value=(1,1,1,1);emission.inputs['Strength'].default_value=strength
    out=nt.nodes.new('ShaderNodeOutputMaterial');nt.links.new(emission.outputs[0],out.inputs['Surface'])
    bpy.ops.mesh.primitive_plane_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.scale=(width,height,1)
    o.rotation_euler=(Vector((0,0,1.7))-o.location).to_track_quat('Z','Y').to_euler()
    o.data.materials.append(cardmat);o.visible_camera=False;move(o,rig)
bpy.ops.object.camera_add();camera=bpy.context.object;camera.name="Product camera";scene.camera=camera
camera.data.type="ORTHO";camera.data.lens=55
bpy.context.preferences.filepaths.save_version=0
manifest={"blender":bpy.app.version_string,"device":device,"source":"assets/moka-refined.glb","renders":[]}
for name,coll in collections.items():
    for c in collections.values():c.hide_render=c!=coll
    if name=="moka": scale=4.05;target=(.24,0,1.53);pos=(4.2,-9,4.5)
    elif name=="pour":scale=2.9;target=(.13,0,1.11);pos=(3,-8,3.8)
    elif name=="espresso":scale=3.25;target=(0,-.12,1.30);pos=(3,-8,3.7)
    elif name=="cup-ice":scale=1.65;target=(0,0,.62);pos=(2.5,-8,4.8)
    else:scale=1.70;target=(.02,0,.40);pos=(2.8,-8,5.8)
    camera.location=pos;aim(camera,target);camera.data.ortho_scale=scale
    scene.render.resolution_x=720;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.render.filepath=str(OUT/(name+".png"))
    print("CAFE_RENDER",name,flush=True)
    bpy.ops.render.render(write_still=True)
    manifest["renders"].append({"name":name,"file":"assets/cafe/"+name+".png","camera":pos,"target":target,"ortho":scale})
for c in collections.values():c.hide_render=c.name!="moka"
camera.location=(4.2,-9,4.5);aim(camera,(.24,0,1.53));camera.data.ortho_scale=4.05
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work'/'cafe-product-studio.blend'))
(OUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2),encoding="utf-8")
print("CAFE_DONE",device,flush=True)
