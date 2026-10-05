"""Refine the separable live exterior without replacing teaching internals."""
import bpy, math, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/moka-silver-v2.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
audit=[]
for ob in objects:
    bpy.context.view_layer.objects.active=ob
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True)
    if 'wood' in ob.name:
        ob.hide_render=True
        continue
    # Keep octagonal faces flat, soften manufactured edges, remove triangulated
    # shading inside coplanar facets. Extras preserve the six assembly groups.
    for poly in ob.data.polygons:poly.use_smooth=True
    ob.data.set_sharp_from_angle(angle=math.radians(32))
    bevel=ob.modifiers.new('Fine live rim highlight','BEVEL')
    bevel.width=.0025;bevel.segments=3;bevel.limit_method='ANGLE';bevel.angle_limit=math.radians(32)
    normal=ob.modifiers.new('Stable facet normals','WEIGHTED_NORMAL')
    normal.keep_sharp=True;normal.weight=50
    ob['finish']='polished' if any(s in ob.name.lower() for s in ['thread','collar','ring']) else 'cast'
    audit.append({'name':ob.name,'part':ob.get('part',ob.parent.name if ob.parent else None),'vertices':len(ob.data.vertices),'finish':ob['finish']})
bpy.ops.object.select_all(action='DESELECT')
for ob in objects:
    if 'wood' not in ob.name:ob.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/live-moka-v3.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/moka-live-v3.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
(ROOT/'work/live-moka-v3-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print('EXPORTED',audit,flush=True)
