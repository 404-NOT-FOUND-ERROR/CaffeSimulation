"""Use the supplied cup geometry for order previews, without the pastry prop."""
import bpy,bmesh,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'cafe'/'supplied'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'work'/'supplied-cup-snack-studio.blend'),load_ui=False,use_scripts=False)
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Circle'))
pastry={i for i,m in enumerate(obj.data.materials) if m and m.name=='Cup_Bread'}
bm=bmesh.new();bm.from_mesh(obj.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index in pastry],context='FACES')
loose=[v for v in bm.verts if not v.link_faces]
if loose:bmesh.ops.delete(bm,geom=loose,context='VERTS')
bm.to_mesh(obj.data);bm.free();obj.data.update()
brew=next(m for m in obj.data.materials if m and m.name.startswith('Cafe / warm milk coffee'))
p=brew.node_tree.nodes.get('Principled BSDF')
scene=bpy.context.scene
for name,color in [('cup-black',(.044,.014,.005)),('cup-milk',(.37,.20,.095))]:
    p.inputs['Base Color'].default_value=(*color,1)
    scene.render.filepath=str(OUT/(name+'.png'))
    print('CUP_RENDER',name,flush=True);bpy.ops.render.render(write_still=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work'/'supplied-cup-order-studio.blend'))
