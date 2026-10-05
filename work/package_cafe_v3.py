"""Lossless geometry/alpha preserving WebP packaging; no painted lighting fixes."""
from PIL import Image,ImageFilter,ImageChops,ImageDraw
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'cafe'
for source,target in [('host-v3.png','host-v3.webp'),('foreground-v3-preview.png','foreground-v3-preview.webp'),('foreground-v3.png','foreground-v3.webp')]:
    p=OUT/source
    if p.exists():
        if (OUT/target).exists() and (OUT/target).stat().st_mtime>=p.stat().st_mtime:continue
        im=Image.open(p).convert('RGBA');im.save(OUT/target,'WEBP',quality=96,method=6)
        print(source,im.size,'=>',target,(OUT/target).stat().st_size)
for key in ['moka','cup-black','cup-milk','pour','espresso']:
    p=OUT/'v3'/(key+'.png');pure=OUT/'v3'/(key+'-clean.png');target=p.with_suffix('.webp')
    if not p.exists() or not pure.exists():continue
    if target.exists() and target.stat().st_mtime>=max(p.stat().st_mtime,pure.stat().st_mtime):continue
    im=Image.open(pure).convert('RGBA');contact=Image.open(p).convert('RGBA')
    alpha=im.getchannel('A');solid=alpha.point(lambda x:255 if x>128 else 0)
    near=solid.filter(ImageFilter.MaxFilter(75)).filter(ImageFilter.GaussianBlur(22))
    shadow=ImageChops.multiply(contact.getchannel('A'),ImageChops.invert(alpha))
    shadow=ImageChops.multiply(shadow,near).point(lambda x:int(x*.35))
    # The indirect shadow-catcher pass includes a faint environment contribution.
    # Restrict it to the actual footprint, never a rectangular field or handle hole.
    band=Image.new('L',im.size,0);bottom=solid.getbbox()[3]
    ImageDraw.Draw(band).rectangle((0,max(0,bottom-65),im.width,im.height),fill=255)
    shadow=ImageChops.multiply(shadow,band.filter(ImageFilter.GaussianBlur(15)))
    under=Image.new('RGBA',im.size,(47,33,22,0));under.putalpha(shadow)
    Image.alpha_composite(under,im).save(target,'WEBP',quality=96,method=6)
    print(key,im.size,target.stat().st_size)
