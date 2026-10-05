import bpy, json, math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
out=root/'assets';out.mkdir(exist_ok=True)
obj=bpy.data.objects['Body Bottom']
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
# Use mesh-local coordinates to remove the arbitrary pose in the source scene.
obj.location=(0,0,0);obj.rotation_euler=(0,0,0);obj.scale=(1,1,1)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
parts=[o for o in bpy.context.selected_objects if o.type=='MESH']
report=[]
for i,o in enumerate(parts):
 b=[o.matrix_world@Vector(v) for v in o.bound_box]
 report.append({'id':i,'name':o.name,'verts':len(o.data.vertices),'polys':len(o.data.polygons),'bounds':[[min(v[j] for v in b),max(v[j] for v in b)] for j in range(3)],'materials':sorted(set(o.data.materials[p.material_index].name for p in o.data.polygons if o.data.materials[p.material_index]))})
(root/'qa'/'loose-parts.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('PARTS',json.dumps(report,ensure_ascii=False))
# A source-only preview, isolated from the scenery and website branding.
for o in bpy.data.objects:o.hide_render=o not in parts
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.eevee.use_gtao=True;scene.eevee.use_ssr=True
scene.world=bpy.data.worlds.new('Preview World');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.7,.7,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
allv=[o.matrix_world@v.co for o in parts for v in o.data.vertices];mn=Vector([min(v[j] for v in allv) for j in range(3)]);mx=Vector([max(v[j] for v in allv) for j in range(3)]);center=(mn+mx)/2
def aim(o,p):o.rotation_euler=(p-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=center+Vector((.45,-.65,.28)));cam=bpy.context.object;cam.hide_render=False;cam.data.type='ORTHO';cam.data.ortho_scale=.35;aim(cam,center);scene.camera=cam
for pos,power,size in [((-.4,-.4,.5),50,.4),((.4,.2,.4),35,.25)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(pos));light=bpy.context.object;light.hide_render=False;light.data.energy=power;light.data.size=size;aim(light,center)
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'qa'/'source-model.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(out/'source-moka.glb'),export_format='GLB',use_selection=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_yup=True)
print('EXPORTED',str(out/'source-moka.glb'))
