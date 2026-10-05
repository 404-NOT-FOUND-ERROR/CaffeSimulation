"""Render choice-page Moka and goal cups using exactly the homepage finish/light."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets'/'cafe'/'v3';OUT.mkdir(exist_ok=True)
only=sys.argv[sys.argv.index('--only')+1].split(',') if '--only' in sys.argv else None
clean='--clean-only' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'work'/'cafe-foreground-v3.blend'),load_ui=False,use_scripts=False)
scene=bpy.context.scene;scene.cycles.samples=144
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
if any(d.type=='OPTIX' for d in prefs.devices):scene.cycles.device='GPU'
table=bpy.data.objects['Ivory stone countertop and dark front'];table.hide_render=True
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.008));floor=bpy.context.object;floor.name='Native contact shadow'
floor.data.materials.append(bpy.data.materials['Honed warm ivory limestone']);floor.is_shadow_catcher=True
if clean:
    # Keep the same reflected floor and bounce, but exclude it from primary rays.
    floor.is_shadow_catcher=False;floor.visible_camera=False
camera=scene.camera
lights=[o for o in scene.objects if o.type in {'LIGHT','CAMERA'} or 'reflection' in o.name.lower()]
cup=[o for o in scene.objects if o.name.startswith(('Porcelain','Coffee surface','Coffee meniscus','CAFFÈ curved ceramic'))]
moka=bpy.data.objects['Moka / supplied exterior with refined materials']
appliances={}
for key in ['pour','espresso']:
    with bpy.data.libraries.load(str(ROOT/'work'/('supplied-'+key+'-studio.blend')),link=False) as (src,dst):
        dst.collections=[n for n in src.collections if n.startswith('Product / ')]
    coll=dst.collections[0];scene.collection.children.link(coll);coll.hide_render=False;bpy.context.view_layer.update()
    appliances[key]=list(coll.objects)
    for o in appliances[key]:
        o.location.x+=5.04
        if o.type!='MESH':continue
        for i,m in enumerate(o.data.materials):
            name=m.name.lower()
            replacement=None
            if 'stainless trim' in name:replacement=bpy.data.materials['Polished aluminium collar']
            elif 'bakelite' in name:replacement=bpy.data.materials['Bakelite / true warm black']
            elif 'ivory porcelain' in name:replacement=bpy.data.materials['Warm white glazed porcelain']
            if replacement:o.material_slots[i].link='DATA';o.material_slots[i].material=replacement
            if 'ground' in name and not m.node_tree.nodes.get('Visible dry coffee grain'):
                nt=m.node_tree;p=nt.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.93
                noise=nt.nodes.new('ShaderNodeTexNoise');noise.name='Visible dry coffee grain';noise.inputs['Scale'].default_value=125;noise.inputs['Detail'].default_value=2
                bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.55;bump.inputs['Distance'].default_value=.018
                ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.04,.016,.006,1);ramp.color_ramp.elements[1].color=(.17,.069,.024,1)
                nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal']);nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
for key in ['moka','cup-black','cup-milk','pour','espresso']:
    if only and key not in only:continue
    visible=lights+[floor]+([moka] if key=='moka' else appliances[key] if key in appliances else cup)
    for o in scene.objects:o.hide_render=o not in visible
    if key in ['moka','pour','espresso']:
        target=(5.04,-.03,1.53);camera.location=(5.04,-14,6.9);scale=4.7 if key=='espresso' else 3.85
        if key in ['pour','espresso']:camera.location=(8.24,-9,4.6)
    else:
        target=(2.85,-.20,.55);camera.location=(2.85,-12,5.0);scale=2.8
        p=bpy.data.materials['Black coffee / warm brown reflection'].node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value=(*((.020,.007,.002) if key=='cup-black' else (.40,.24,.125)),1)
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
    scene.render.resolution_x=960;scene.render.resolution_y=1200;scene.render.filepath=str(OUT/(key+('-clean' if clean else '')+'.png'))
    print('CHOICE_RENDER',key,flush=True);bpy.ops.render.render(write_still=True)
