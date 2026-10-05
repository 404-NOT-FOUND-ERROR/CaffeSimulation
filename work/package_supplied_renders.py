"""Package native Blender renders, keeping contact shadows close to the product."""
from PIL import Image, ImageFilter, ImageChops
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'cafe'/'supplied'
report=[]
for name in ['moka','cup-snack','espresso','pour','cup-black','cup-milk']:
    src=Image.open(OUT/(name+'.png')).convert('RGBA')
    alpha=src.getchannel('A')
    solid=alpha.point(lambda v:255 if v>180 else 0)
    bounds=solid.getbbox()
    if not bounds:raise RuntimeError('Empty product render: '+name)
    near=solid.filter(ImageFilter.MaxFilter(75)).filter(ImageFilter.GaussianBlur(25))
    contact=Image.open(OUT/(name+'-contact.png')).getchannel('A')
    shadow_alpha=ImageChops.multiply(ImageChops.multiply(contact,ImageChops.invert(alpha)),near).point(lambda a:int(a*.48))
    shadow=Image.new('RGBA',src.size,(35,25,17,0));shadow.putalpha(shadow_alpha)
    src=Image.alpha_composite(shadow,src)
    src.save(OUT/(name+'.webp'),quality=94,method=6)
    home=None; home_size=None
    if name in {'moka','cup-snack'}:
        left,top,right,bottom=bounds;pad=40
        crop=src.crop((max(0,left-pad),max(0,top-pad),min(src.width,right+pad),min(src.height,bottom+pad)))
        home=name+'-home.webp';home_size=crop.size
        crop.save(OUT/home,quality=95,method=6)
    report.append({'name':name,'source_size':src.size,'solid_bounds':bounds,'web':'assets/cafe/supplied/'+name+'.webp','home':home,'home_size':home_size})
(OUT/'web-manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
