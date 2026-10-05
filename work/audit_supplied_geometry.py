import bpy,json,sys
from pathlib import Path
from mathutils import Vector
key=sys.argv[sys.argv.index('--')+1]
o=bpy.data.objects.get('Coffee Pot Body' if key=='moka' else 'Circle')
parent=list(range(len(o.data.vertices)))
def find(i):
    while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
    return i
for edge in o.data.edges:
    a,b=map(find,edge.vertices)
    if a!=b:parent[b]=a
groups={}
for v in o.data.vertices:groups.setdefault(find(v.index),{'vertices':[],'polygons':[]}).get('vertices').append(v.index)
for p in o.data.polygons:groups[find(p.vertices[0])]['polygons'].append(p.index)
report=[]
for g in groups.values():
    points=[o.matrix_world@o.data.vertices[i].co for i in g['vertices']]
    counts={}
    for i in g['polygons']:
        material=o.data.polygons[i].material_index
        counts[material]=counts.get(material,0)+1
    report.append({'vertices':len(g['vertices']),'polygons':len(g['polygons']),'start_face':g['polygons'][0] if g['polygons'] else None,'materials':{o.data.materials[i].name:count for i,count in counts.items()},'bounds':[[min(v[i] for v in points) for i in range(3)],[max(v[i] for v in points) for i in range(3)]]})
report.sort(key=lambda g:-g['polygons'])
Path('moka-lab/work/'+key+'-geometry-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
