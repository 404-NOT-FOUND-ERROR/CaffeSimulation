"""Export the editable poster model as six rigorous live-web components.

The native poster scene supplies geometry, bevels and materials. No generated
concept image is used as a model texture, or as a baked interactive interface.
"""
import bpy, bmesh, json, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'hybrid'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'work/poster-workbench-v1.blend'))
scene = bpy.context.scene
components = ['lower', 'basket', 'gasket', 'filter', 'upper', 'lid']
offsets = dict(lower=0, basket=1.30, gasket=1.66, filter=1.86, upper=2.50, lid=3.10)
objects = [o for o in scene.objects if o.get('component') in components]
# A real basket has a cylindrical dose chamber, not a shallow saucer.
# Its rim remains at the same seating plane and clears the boiler neck.
basket = next(o for o in objects if o.name == 'Funnel basket')
basket_profile = [(.072,.68),(.072,1.14),(.48,1.28),(.52,1.28),
                  (.52,1.64),(.48,1.64),(.48,1.31),(.048,1.16),(.048,.68)]
basket_vertices = [(r*math.cos(i*math.tau/64+math.pi/8),
                    r*math.sin(i*math.tau/64+math.pi/8), z)
                   for r,z in basket_profile for i in range(64)]
basket_faces = [(j*64+i,j*64+(i+1)%64,((j+1)%len(basket_profile))*64+(i+1)%64,
                 ((j+1)%len(basket_profile))*64+i)
                for j in range(len(basket_profile)) for i in range(64)]
basket_mesh = bpy.data.meshes.new('Deep cylindrical dose basket')
basket_mesh.from_pydata(basket_vertices,[],basket_faces);basket_mesh.update()
for mat in basket.data.materials: basket_mesh.materials.append(mat)
for face in basket_mesh.polygons: face.use_smooth=True
basket.data=basket_mesh
# Remove false metal interpenetration at the assembled neck. A shallow overlap
# of the seated rubber seal is intentional; metal walls have radial clearance.
collar = next(o for o in objects if o.name == 'Upper polished collar')
profile = [(.61,1.52),(.65,1.52),(.65,1.93),(.55,1.93),
           (.55,1.74),(.49,1.74),(.49,1.71),(.61,1.71)]
verts = [(r*math.cos(i*math.tau/64+math.pi/8),
          r*math.sin(i*math.tau/64+math.pi/8), z) for r,z in profile for i in range(64)]
faces = [(j*64+i,j*64+(i+1)%64,((j+1)%len(profile))*64+(i+1)%64,
          ((j+1)%len(profile))*64+i) for j in range(len(profile)) for i in range(64)]
collar_mesh = bpy.data.meshes.new('Clearance collar and seal seat')
collar_mesh.from_pydata(verts,[],faces); collar_mesh.update()
for mat in collar.data.materials: collar_mesh.materials.append(mat)
collar.data = collar_mesh

for ob in list(scene.objects):
    if ob not in objects:
        bpy.data.objects.remove(ob, do_unlink=True)

# Drill actual holes rather than drawing black dots on a solid filter plate.
filter_plate = next(o for o in objects if o.name.startswith('Filter plate'))
fake_holes = [o for o in objects if o.name.startswith('Filter perforation')]
bpy.ops.object.select_all(action='DESELECT')
cutters = []
for dot in fake_holes:
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=.012, depth=.06,
                                       location=(dot.location.x, dot.location.y, 1.72))
    cutters.append(bpy.context.object)
for c in cutters:
    c.select_set(True)
bpy.context.view_layer.objects.active = cutters[0]
bpy.ops.object.join()
cutter = bpy.context.object
boolean = filter_plate.modifiers.new('Through perforations', 'BOOLEAN')
boolean.operation = 'DIFFERENCE'
boolean.solver = 'EXACT'
boolean.object = cutter
bpy.context.view_layer.objects.active = filter_plate
while list(filter_plate.modifiers).index(boolean) > 0:
    bpy.ops.object.modifier_move_up(modifier=boolean.name)
bpy.ops.object.modifier_apply(modifier=boolean.name)
for ob in fake_holes + [cutter]:
    bpy.data.objects.remove(ob, do_unlink=True)
objects = [o for o in scene.objects if o.get('component') in components]

groups = {}
for name in components:
    group = bpy.data.objects.new(name, None)
    group['part'] = name
    scene.collection.objects.link(group)
    groups[name] = group
for ob in objects:
    part = ob['component']
    ob.hide_render = False
    ob.hide_viewport = False
    ob.hide_set(False)
    ob['part'] = part
    ob['finish'] = ('rubber' if part == 'gasket' else
                    'bakelite' if 'handle' in ob.name.lower() or 'knob' in ob.name.lower() else
                    'brass' if 'brass' in ob.name.lower() else
                    'polished' if any(s in ob.name.lower() for s in ['collar', 'chimney', 'funnel', 'thread', 'filter', 'rivet', 'hinge', 'valve face']) else 'cast')
    ob.parent = groups[part]
    if ob.type == 'MESH':
        # Native mesh profiles have both interior and exterior walls. Correct
        # winding before glTF backface culling; triangulate the concave handle
        # explicitly so its continuous C-shaped grip survives web export.
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        if 'handle' in ob.name.lower():
            bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
        bm.to_mesh(ob.data)
        bm.free()
        ob.data.update()
        # Facets stay flat; weighted normals keep the bevels readable.
        ob.data.set_sharp_from_angle(angle=math.radians(32))
        for p in ob.data.polygons:
            # Sharp octagonal boundaries remain split; bevels and circular
            # surfaces get continuous normals rather than faceted highlights.
            p.use_smooth = True
        for modifier in ob.modifiers:
            if modifier.type == 'BEVEL':
                modifier.segments = 5
                modifier.harden_normals = True
                if ob['finish'] == 'cast': modifier.width = max(modifier.width, .020)
                if ob['finish'] == 'bakelite': modifier.width *= 1.2

# Bake only local cavity occlusion into vertex colors. Parts are temporarily
# spread apart, so the web explosion never reveals shadows from an absent part.
# This keeps genuine thickness in the collector and basket without screen-space
# artifacts or shadows painted across adjacent parts.
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.bake.target = 'VERTEX_COLORS'
scene.render.bake.use_clear = True
scene.render.threads_mode = 'FIXED'
scene.render.threads = 8
for name, group in groups.items(): group.location.z = offsets[name]
bpy.context.view_layer.update()
for ob in objects:
    if ob.type != 'MESH': continue
    # Evaluate the five-segment bevel before baking so its normals and color
    # attributes match the geometry actually exported to the browser.
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    for modifier in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    attr = ob.data.color_attributes.new(name='Cavity', type='FLOAT_COLOR', domain='CORNER')
    ob.data.color_attributes.active_color = attr
    bpy.ops.object.bake(type='AO')
    for color in attr.data:
        occlusion = max(.42, min(1.0, color.color[0]))
        # A gentle contact layer; reflected room light still lights the cavity.
        value = .30 + .70 * occlusion
        color.color = (value, value, value, 1)
for group in groups.values(): group.location.z = 0

bpy.context.view_layer.update()
audit = {}
for part in components:
    points = [o.matrix_world @ Vector(v) for o in objects if o.get('part') == part for v in o.bound_box]
    lo = [min(v[i] for v in points) for i in range(3)]
    hi = [max(v[i] for v in points) for i in range(3)]
    audit[part] = {'min': lo, 'max': hi, 'offset': offsets[part],
                   'meshes': len([o for o in objects if o.get('part') == part])}
gaps = []
for a, b in zip(components, components[1:]):
    gap = audit[b]['min'][2] + offsets[b] - audit[a]['max'][2] - offsets[a]
    assert gap > .025, f'Exploded parts overlap: {a} / {b}, gap={gap}'
    gaps.append({'between': [a, b], 'gap': round(gap, 5)})

# The lower safety valve and basket stem are on the boiler group / shared axis.
# A conventional octagonal teaching vessel, not an appliance-specific CAD file.
geometry = {
    'units': 'illustrative model units', 'axis': 'Y in glTF, Z in Blender',
    'lower': {'bottom': .43, 'shoulder': 1.57, 'top': 1.65, 'bottomRadius': .74, 'neckRadius': .58},
    'upper': {'bottom': 1.88, 'shoulder': 1.92, 'top': 3.18, 'bottomRadius': .58, 'topRadius': .91},
    'lid': {'bottom': 3.18, 'top': 3.75},
    'valveHeight': 1.20, 'basketStemBottom': .68, 'basketRim': 1.64,
    'filterHeight': 1.72, 'gasketHeight': 1.69,
    'joint': {'neckOuterRadius': .603, 'collarInnerRadius': .61,
              'radialClearance': .007, 'collarBottom': 1.52,
              'sealSeatHeight': 1.71, 'sealTop': 1.71},
    'offsets': offsets, 'components': audit, 'explodedGaps': gaps,
    'source': 'work/poster-workbench-v1.blend',
    'note': 'Project-created educational geometry; not dimensionally certified for real manufacture.'
}
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/hybrid-moka-v1.blend'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT / 'moka-v1.glb'), export_format='GLB',
                         export_apply=True, export_extras=True, use_selection=True,
                         export_vertex_color='ACTIVE', export_all_vertex_colors=True)
(OUT / 'geometry.json').write_text(json.dumps(geometry, ensure_ascii=False, indent=2), encoding='utf-8')
print('HYBRID_MODEL_COMPLETE', json.dumps({'groups': components, 'gaps': gaps}), flush=True)
