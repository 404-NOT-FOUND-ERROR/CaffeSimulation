import bpy, json, sys
from pathlib import Path
from mathutils import Vector

target=Path(sys.argv[sys.argv.index('--')+1])
scene=bpy.context.scene
report={'file':bpy.data.filepath,'reader':bpy.app.version_string,'objects':[], 'materials':[], 'images':[]}
for o in scene.objects:
    item={'name':o.name,'type':o.type,'hidden':o.hide_render,'collections':[c.name for c in o.users_collection], 'instance_collection':o.instance_collection.name if o.instance_collection else None}
    if o.type=='MESH':
        bounds=[o.matrix_world@Vector(v) for v in o.bound_box]
        item.update(vertices=len(o.data.vertices),polygons=len(o.data.polygons),materials=[m.name if m else None for m in o.data.materials],modifiers=[{'type':m.type,'name':m.name} for m in o.modifiers],bounds=[[min(v[i] for v in bounds) for i in range(3)],[max(v[i] for v in bounds) for i in range(3)]])
    if o.type=='CAMERA':item.update(location=list(o.location),rotation=list(o.rotation_euler),lens=o.data.lens)
    report['objects'].append(item)
report['collections']=[{'name':c.name,'objects':[o.name for o in c.objects]} for c in bpy.data.collections]
deps=bpy.context.evaluated_depsgraph_get()
report['evaluated_meshes']=[]
for inst in deps.object_instances:
    o=inst.object
    if o.type!='MESH':continue
    bounds=[inst.matrix_world@Vector(v) for v in o.bound_box]
    report['evaluated_meshes'].append({'name':o.name,'instance':inst.is_instance,'materials':[m.name if m else None for m in o.data.materials], 'polygons':len(o.data.polygons),'bounds':[[min(v[i] for v in bounds) for i in range(3)],[max(v[i] for v in bounds) for i in range(3)]]})
for m in bpy.data.materials:
    report['materials'].append({'name':m.name,'nodes':[n.type for n in m.node_tree.nodes] if m.use_nodes else [],'color':list(m.diffuse_color)})
for i in bpy.data.images:
    if i.source not in {'VIEWER','GENERATED'}:
        report['images'].append({'name':i.name,'source':i.source,'packed':bool(i.packed_file),'path':i.filepath,'size':list(i.size),'exists':bool(i.packed_file) or Path(bpy.path.abspath(i.filepath)).is_file()})
target.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('SOURCE_INSPECTED',Path(bpy.data.filepath).name,len(report['objects']),len(report['images']),flush=True)
