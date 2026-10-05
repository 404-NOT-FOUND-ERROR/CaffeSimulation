"""Render user-supplied Blender products in a shared, editable product studio.

Run with Blender 4.5+, --disable-autoexec, --python-exit-code 1.
Original .blend files are opened read-only; processed scenes are saved under work.
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'model'
OUT = ROOT / 'assets' / 'cafe' / 'supplied'
OUT.mkdir(parents=True, exist_ok=True)
preview = '--preview' in sys.argv
selection = sys.argv[sys.argv.index('--only')+1] if '--only' in sys.argv else None
products = [('moka','摩卡壶.blend'),('cup-snack','咖啡杯配零食.blend'),
            ('espresso','咖啡机.blend'),('pour','手冲.blend')]

def allowed(name, key):
    if key == 'moka': return name == 'Coffee Pot Body'
    if key == 'cup-snack': return name == 'Circle'
    if key == 'pour': return name in {'Wooden Sleeve','Wooden Ring','Cube.061','Chemex Glass'}
    return name not in {'blenderco.cn','Plane.013','tree_4','blenderco_cn.008','stx'} and not name.startswith('EspressoGlass')

def mat(name, color, rough=.25, metal=0, transmission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    p.inputs['Transmission Weight'].default_value=transmission
    return m

def lathe(name, profile, material, coll, segments=96):
    verts=[]; faces=[]
    for r,z in profile:
        for j in range(segments):
            a=math.tau*j/segments; verts.append((r*math.cos(a),r*math.sin(a),z))
    for i in range(len(profile)-1):
        for j in range(segments):
            a=i*segments+j; b=i*segments+(j+1)%segments
            faces.append((a,b,b+segments,a+segments))
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.materials.append(material)
    o=bpy.data.objects.new(name,me); coll.objects.link(o)
    for face in me.polygons: face.use_smooth=True
    return o

def aim(obj, point):
    obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def light(coll, name, loc, energy, width, height, target):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy
    data.shape='RECTANGLE';data.size=width;data.size_y=height
    obj=bpy.data.objects.new(name,data);coll.objects.link(obj);obj.location=loc;aim(obj,target)
    return obj

def art_direct(product,key):
    """Keep UVs and supplied silhouettes; replace materials that break the poster palette."""
    aluminium=mat('Cafe / finely cast aluminium',(.50,.52,.54),.25,.96)
    nt=aluminium.node_tree; p=nt.nodes.get('Principled BSDF')
    noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=280
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.07;bump.inputs['Distance'].default_value=.0003
    nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    satin=mat('Cafe / soft stainless trim',(.67,.68,.69),.23,.97)
    black=mat('Cafe / satin bakelite',(.013,.011,.009),.40)
    black.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.24
    brass=mat('Cafe / safety valve brass',(.46,.28,.09),.30,.87)
    ceramic=mat('Cafe / ivory porcelain',(.79,.75,.67),.23)
    ceramic.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.2
    glass=mat('Cafe / clear borosilicate',(.93,.96,.98),.055,transmission=1)
    glass.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.46
    enamel=mat('Cafe / espresso enamel',(.044,.029,.023),.31,.25)
    enamel.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.15
    leather=mat('Cafe / dark leather cord',(.027,.012,.007),.68)
    brew=mat('Cafe / warm milk coffee',(.37,.20,.095),.28)
    wood=mat('Cafe / warm walnut sleeve',(.25,.13,.058),.51)
    nt=wood.node_tree
    tex=nt.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=3;tex.inputs['Detail'].default_value=3
    coord=nt.nodes.new('ShaderNodeTexCoord');mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1,1,38)
    nt.links.new(coord.outputs['Generated'],mapping.inputs[0]);nt.links.new(mapping.outputs[0],tex.inputs['Vector'])
    ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.18;ramp.color_ramp.elements[0].color=(.12,.048,.018,1)
    ramp.color_ramp.elements[1].position=.82;ramp.color_ramp.elements[1].color=(.32,.18,.085,1)
    nt.links.new(tex.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
    for obj in product.objects:
        for i,source in enumerate(obj.data.materials):
            if not source:continue
            name=source.name
            replacement=None
            if key=='moka':
                if name.startswith('CoffeePotBody'):replacement=aluminium
                elif name.startswith('Black'):replacement=black
                elif name.startswith('MetalBrushed'):replacement=brass
                else:replacement=satin
            elif key=='cup-snack':
                if name=='Cup_Glass':replacement=ceramic
                elif name=='Cup_Brew':replacement=brew
                # Keep the supplied pastry UV texture and shape.
            elif key=='pour':
                replacement={'Wood':wood,'Leather':leather,'Glass':glass}.get(name)
            else:
                if obj.name.startswith('CoffeeMachineMain'):replacement=enamel
                elif name=='BeanContainerLidPlastic':replacement=black
                elif 'Plastic' in name or name in {'Rubber','TampPlastic','Nikon'}:
                    replacement=glass if name in {'WaterTankPlastic','ClearPlastic.001'} else black
                elif any(token in name for token in ['Steel','Aluminium','Metal']):replacement=satin
            if replacement:obj.data.materials[i]=replacement
        if key=='moka':
            bevel=obj.modifiers.new('Refined manufactured edge','BEVEL');bevel.width=.00018;bevel.segments=3
            bevel.limit_method='ANGLE';bevel.angle_limit=math.radians(35);bevel.harden_normals=True
            normals=obj.modifiers.new('Balanced facet highlights','WEIGHTED_NORMAL');normals.keep_sharp=True
    return ceramic,brew

manifest={'blender':bpy.app.version_string,'source_folder':'../model','renders':[]}
for key, filename in products:
    if selection and key != selection: continue
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/filename),load_ui=False,use_scripts=False)
    scene=bpy.context.scene
    deps=bpy.context.evaluated_depsgraph_get()
    parts=[];bounds=[]
    # Realize only the product instances. Source studio walls, references, and cameras
    # must never contaminate either the model bounds or the transparent render.
    for instance in deps.object_instances:
        obj=instance.object
        if obj.type!='MESH' or not allowed(obj.name,key):continue
        mesh=bpy.data.meshes.new_from_object(obj,preserve_all_data_layers=True,depsgraph=deps)
        parts.append((obj.name,mesh,instance.matrix_world.copy()))
        bounds.extend(instance.matrix_world@Vector(c) for c in obj.bound_box)
    if not parts: raise RuntimeError('No product geometry found: '+key)
    low=Vector([min(v[i] for v in bounds) for i in range(3)])
    high=Vector([max(v[i] for v in bounds) for i in range(3)])
    for obj in list(scene.objects): bpy.data.objects.remove(obj,do_unlink=True)
    for coll in list(scene.collection.children):scene.collection.children.unlink(coll)
    product=bpy.data.collections.new('Product / '+key);scene.collection.children.link(product)
    rig=bpy.data.collections.new('Studio / lights and reflections');scene.collection.children.link(rig)
    center=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z))
    height=1.35 if key=='cup-snack' else 3.0
    factor=height/(high.z-low.z)
    normalize=Matrix.Scale(factor,4) @ Matrix.Translation(-center)
    for name,mesh,world in parts:
        obj=bpy.data.objects.new(name,mesh);product.objects.link(obj);obj.matrix_world=normalize@world

    ceramic,brew=art_direct(product,key)
    if key=='espresso':
        # Remove the visual clutter of six empty glasses on top; place one cup at
        # the actual outlet so the product reads as a usable brewing instrument.
        cup=lathe('Serving cup',[(0,.53),(.23,.53),(.25,.58),(.31,1.13),(.305,1.15),(.279,1.15),(.22,.63),(0,.63)],ceramic,product)
        cup.location=(.35,-.70,0)
        drink=lathe('Espresso in serving cup',[(0,.65),(.22,.65),(.276,1.07),(0,1.07)],mat('Cafe / espresso coffee',(.048,.015,.005),.24),product)
        drink.location=(.35,-.70,0)

    # The supplied Chemex is an empty vessel. Add a visible paper filter and coffee,
    # rather than present a brewing method with no filter or liquid.
    if key=='pour':
        paper=mat('Lab / natural filter paper',(.69,.56,.39),.82)
        grounds=mat('Lab / coffee grounds',(.035,.015,.007),.87)
        liquid=mat('Lab / filtered coffee',(.075,.022,.008),.22)
        lathe('Brewing paper filter',[(.035,1.65),(.66,2.92),(.69,2.97),(.72,3.06),(.71,3.075),(.64,2.92),(.02,1.66)],paper,product)
        lathe('Ground coffee in filter',[(0,1.67),(.04,1.67),(.60,2.84),(0,2.84)],grounds,product)
        lathe('Filtered coffee in lower vessel',[(0,.06),(.63,.06),(.73,.2),(.75,.65),(.60,.95),(0,.95)],liquid,product)

    scene.render.engine='CYCLES';scene.cycles.samples=24 if preview else 96
    scene.cycles.use_denoising=True;scene.cycles.max_bounces=10
    scene.cycles.transmission_bounces=8;scene.cycles.transparent_max_bounces=8
    device='CPU'
    try:
        prefs=bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type='OPTIX';prefs.get_devices()
        if any(d.type=='OPTIX' for d in prefs.devices):
            for d in prefs.devices:d.use=d.type=='OPTIX'
            scene.cycles.device='GPU';device='OPTIX'
    except Exception as exc: print('GPU fallback',str(exc),flush=True)
    scene.render.film_transparent=True
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.render.image_settings.color_depth='8'
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=0;scene.view_settings.gamma=1
    scene.world=bpy.data.worlds.new('Neutral daylight studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.60,.61,.63,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.24
    target=(0,0,height*.48)
    light(rig,'Key / broad daylight',(-3.5,-4.5,5),520,3.2,5.0,target)
    light(rig,'Fill / soft neutral',(4,-2,3.5),130,2.6,4.5,target)
    light(rig,'Rim / soft strip',(-2,3,5),340,2.4,4,target)
    # Neutral bounce beneath the object, with transparent contact shadows.
    floor_mat=mat('Studio / neutral shadow catcher',(.74,.71,.65),.88)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005))
    floor=bpy.context.object;floor.name='Transparent contact shadow';floor.data.materials.append(floor_mat)
    floor.is_shadow_catcher=True
    floor.visible_glossy=False
    for c in list(floor.users_collection):c.objects.unlink(floor)
    rig.objects.link(floor)
    for name,pos,w,h,strength in [('Left vertical reflection',(-2,-4,1.8),1.1,5,2.1),('Right vertical reflection',(3,-3,1.8),.7,4,1.1)]:
        m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear()
        em=n.new('ShaderNodeEmission');em.inputs['Color'].default_value=(1,1,1,1);em.inputs['Strength'].default_value=strength
        out=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
        bpy.ops.mesh.primitive_plane_add(size=1,location=pos);card=bpy.context.object
        card.name=name;card.scale=(w,h,1);card.rotation_euler=(Vector(target)-card.location).to_track_quat('Z','Y').to_euler()
        card.data.materials.append(m);card.visible_camera=False;card.visible_shadow=False
        card.visible_transmission=False;card.visible_diffuse=False
        for c in list(card.users_collection):c.objects.unlink(card)
        rig.objects.link(card)
    flagmat=mat('Studio / dark reflection flag',(.005,.005,.005),.95)
    bpy.ops.mesh.primitive_plane_add(size=1,location=(.6,-3.5,1.8));flag=bpy.context.object
    flag.name='Dark vertical reflection / separates the aluminium facets';flag.scale=(.75,4.5,1)
    flag.rotation_euler=(Vector(target)-flag.location).to_track_quat('Z','Y').to_euler()
    flag.data.materials.append(flagmat);flag.visible_camera=False;flag.visible_shadow=False
    flag.visible_transmission=False;flag.visible_diffuse=False
    for c in list(flag.users_collection):c.objects.unlink(flag)
    rig.objects.link(flag)
    bpy.ops.object.camera_add();camera=bpy.context.object;camera.name='Product camera';scene.camera=camera
    camera.data.type='ORTHO';camera.data.lens=60
    camera.location=(3.2,-9,4.6) if key!='cup-snack' else (2.2,-7,5.0)
    aim(camera,target)
    camera.data.ortho_scale={'moka':3.7,'cup-snack':2.8,'espresso':4.7,'pour':3.85}[key]
    scene.render.resolution_x=480 if preview else 960
    scene.render.resolution_y=600 if preview else 1200
    scene.render.resolution_percentage=100
    scene.render.filepath=str(OUT/(key+('-preview' if preview else '')+'.png'))
    bpy.context.preferences.filepaths.save_version=0
    if not preview:
        bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
        bpy.ops.file.pack_all()
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work'/('supplied-'+key+'-studio.blend')))
    print('PRODUCT_RENDER',key,'parts',len(parts),'device',device,flush=True)
    bpy.ops.render.render(write_still=True)
    manifest['renders'].append({'key':key,'source':filename,'parts':len(parts),'device':device,'height':height,'camera':list(camera.location),'orthographic_scale':camera.data.ortho_scale,'output':scene.render.filepath})
    print('PRODUCT_DONE',key,flush=True)
(OUT/('preview-manifest.json' if preview else 'render-manifest.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
