"""Separate the native product alpha from the studio's contact-shadow pass."""
import bpy, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'cafe'/'supplied'
for key in ['moka','cup-snack','espresso','pour','cup-black','cup-milk']:
    blend='cup-order' if key.startswith('cup-') and key!='cup-snack' else key
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'work'/('supplied-'+blend+'-studio.blend')),load_ui=False,use_scripts=False)
    scene=bpy.context.scene
    if key in {'cup-black','cup-milk'}:
        material=next(m for m in bpy.data.materials if m.name.startswith('Cafe / warm milk coffee'))
        material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*((.044,.014,.005) if key=='cup-black' else (.37,.20,.095)),1)
    shutil.copy2(OUT/(key+'.png'),OUT/(key+'-contact.png'))
    floor=next(o for o in scene.objects if o.name=='Transparent contact shadow')
    floor.hide_render=True
    scene.render.filepath=str(OUT/(key+'.png'))
    print('CLEAN_ALPHA_RENDER',key,flush=True);bpy.ops.render.render(write_still=True)
