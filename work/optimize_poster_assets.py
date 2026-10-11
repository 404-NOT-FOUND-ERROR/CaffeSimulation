"""Compress project-rendered product layers; preserve their dimensions and alpha."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'assets'/'poster-workbench'
total=0
for path in root.glob('*.png'):
    if path.stem=='closed-preview':continue
    with Image.open(path) as image:
        image.save(path.with_suffix('.webp'),'WEBP',quality=92,method=6,exact=True)
    total+=path.with_suffix('.webp').stat().st_size
manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
manifest['runtime_format']='WebP 92, original RGBA render dimensions preserved'
manifest['runtime_bytes']=total
(root/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Runtime asset bytes:',total)
