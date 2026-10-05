import bpy, bmesh, json, math
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'assets';out.mkdir(exist_ok=True)
obj=bpy.data.objects['Body Bottom']
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
obj.location=(0,0,0);obj.rotation_euler=(0,0,0);obj.scale=(1,1,1)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
parts=list(bpy.context.selected_objects)
names={'Body Bottom':('lower-shell','lower'),'Body Bottom.001':('upper-collar','upper'),'Body Bottom.002':('lid-plate','lid'),'Body Bottom.003':('wood-knob','lid'),'Body Bottom.004':('wood-handle','upper'),'Body Bottom.005':('upper-shell','upper')}
cx=-.027941535;scale=3.25/.237522587
groups={key:bpy.data.objects.new(key,None) for key in ['lower','upper','lid']}
for g in groups.values():bpy.context.collection.objects.link(g)
report=[]
for o in parts:
 name,part=names[o.name];o.name=name
 # Open the flat end caps for the educational exploded view. The source supplies exterior geometry only.
 mesh=o.data;bm=bmesh.new();bm.from_mesh(mesh);removed=0
 if name in ['lower-shell','upper-shell','upper-collar']:
  ends=[max(v.co.z for v in bm.verts)] if name=='lower-shell' else [min(v.co.z for v in bm.verts),max(v.co.z for v in bm.verts)]
  caps=[f for f in bm.faces if any(all(abs(v.co.z-end)<.00002 for v in f.verts) for end in ends)]
  removed=len(caps);bmesh.ops.delete(bm,geom=caps,context='FACES_ONLY')
 bm.to_mesh(mesh);bm.free()
 for v in mesh.vertices:v.co.x=(v.co.x-cx)*scale;v.co.y*=scale;v.co.z*=scale
 mesh.update();o.parent=groups[part];o['part']=part;o['source']='blenderco_cn.blend'
 bpy.context.view_layer.objects.active=o
 for p in mesh.polygons:p.use_smooth=True
 mesh.use_auto_smooth=True;mesh.auto_smooth_angle=math.radians(30)
 if name not in ['wood-handle','wood-knob']:
  bevel=o.modifiers.new('Fine machined edge','BEVEL');bevel.width=.006;bevel.segments=3;bevel.limit_method='ANGLE';bevel.angle_limit=math.radians(28);bevel.harden_normals=True
  bpy.ops.object.modifier_apply(modifier=bevel.name)
  weighted=o.modifiers.new('Preserve broad facet normals','WEIGHTED_NORMAL');weighted.keep_sharp=True;weighted.weight=50
  bpy.ops.object.modifier_apply(modifier=weighted.name)
 report.append({'name':name,'part':part,'verts':len(o.data.vertices),'polygons':len(o.data.polygons),'removedCaps':removed})
 # Replace unsupported normal-channel flipping nodes with portable tangent-space image nodes.
for name in ['White','Copper','Wood']:
 mat=bpy.data.materials[name];mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear()
 shader=nodes.new('ShaderNodeBsdfPrincipled');output=nodes.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(shader.outputs['BSDF'],output.inputs['Surface'])
 shader.inputs['Base Color'].default_value=(.012,.012,.010,1) if name=='Wood' else (.68,.69,.70,1)
 shader.inputs['Metallic'].default_value=0 if name=='Wood' else .98
 shader.inputs['Roughness'].default_value=.52 if name=='Wood' else .34
bpy.ops.object.select_all(action='DESELECT')
for o in parts+list(groups.values()):o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(out/'moka-refined.glb'),export_format='GLB',use_selection=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_yup=True,export_extras=True)
report={'source':'blenderco_cn.blend','parts':report,'asset':str(out/'moka-refined.glb'),'notes':'Refined bevels and weighted normals. Concept silver/black materials. Exterior from supplied model; supplemental internals are teaching geometry.'}
(root/'qa'/'model-export.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('EXPORT',json.dumps(report,ensure_ascii=False))
