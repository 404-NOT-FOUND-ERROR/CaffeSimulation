import bpy,json
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'work'/'supplied-moka-studio.blend'),load_ui=False,use_scripts=False)
o=bpy.data.objects['Coffee Pot Body']
print('AUDIT',json.dumps({'mods':[(m.name,m.type) for m in o.modifiers],'slots':[(s.link,s.material.name) for s in o.material_slots],'poly':dict(Counter(p.material_index for p in o.data.polygons)),'matrix':[list(v) for v in o.matrix_world]},ensure_ascii=False),flush=True)
for i in range(len(o.data.materials)):
    inds=set(v for p in o.data.polygons if p.material_index==i for v in p.vertices)
    vv=[o.matrix_world@o.data.vertices[j].co for j in inds]
    print('BOUNDS',i,[min(v[k] for v in vv) for k in range(3)],[max(v[k] for v in vv) for k in range(3)],flush=True)
