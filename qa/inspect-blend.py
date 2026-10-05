import bpy, json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
data={'version':bpy.app.version_string,'objects':[],'materials':[],'images':[]}
for obj in bpy.data.objects:
 b=[obj.matrix_world @ Vector(p) for p in obj.bound_box] if obj.type=='MESH' else []
 data['objects'].append({'name':obj.name,'type':obj.type,'parent':obj.parent.name if obj.parent else None,'location':list(obj.location),'rotation':list(obj.rotation_euler),'scale':list(obj.scale),'bounds':[[min(v[i] for v in b),max(v[i] for v in b)] for i in range(3)] if b else None,'verts':len(obj.data.vertices) if obj.type=='MESH' else 0,'polygons':len(obj.data.polygons) if obj.type=='MESH' else 0,'materials':[m.name if m else None for m in obj.data.materials] if obj.type=='MESH' else [],'modifiers':[{'name':m.name,'type':m.type,'show_viewport':m.show_viewport,'show_render':m.show_render} for m in obj.modifiers]})
for m in bpy.data.materials:
 nodes=[]
 if m.use_nodes:
  for n in m.node_tree.nodes:
   entry={'type':n.type,'name':n.name,'inputs':{i.name:list(i.default_value) if hasattr(i.default_value,'__len__') and not isinstance(i.default_value,str) else i.default_value for i in n.inputs if hasattr(i,'default_value') and isinstance(i.default_value,(int,float,str,tuple))}}
   if n.type=='BSDF_PRINCIPLED':entry['principled']={i.name:list(i.default_value) if hasattr(i.default_value,'__len__') else i.default_value for i in n.inputs if i.name in ['Base Color','Metallic','Roughness','Specular IOR Level','Coat Weight']}
   nodes.append(entry)
 data['materials'].append({'name':m.name,'diffuse':list(m.diffuse_color),'nodes':nodes,'links':[{'from':l.from_node.name,'to':l.to_node.name,'input':l.to_socket.name} for l in m.node_tree.links] if m.use_nodes else []})
for img in bpy.data.images:data['images'].append({'name':img.name,'path':img.filepath,'size':list(img.size),'packed':bool(img.packed_file)})
(root/'qa'/'blend-inspection.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('INSPECTION',json.dumps({'objects':[(o['name'],o['type'],o['verts'],o['bounds']) for o in data['objects']],'images':data['images']},ensure_ascii=False))
