import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filename=path.resolve(root,process.argv[2]||'dist/caffe-simulation.html');
const html=await fs.readFile(filename,'utf8');
const manifest=JSON.parse(await fs.readFile(path.join(path.dirname(filename),'single-html-manifest.json'),'utf8'));
const encoded=html.match(/<script id="coffee-package" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(encoded,'The standalone file contains its resource package');
const pack=JSON.parse(encoded);
assert.deepEqual(Object.keys(pack.pages),['studio','brew','mix']);
assert.equal(Buffer.byteLength(html),manifest.bytes);
assert.equal(createHash('sha256').update(html).digest('hex'),manifest.sha256);
assert.equal(Object.keys(pack.assets).length,manifest.assetCount);
assert.ok(pack.license.includes('MIT'),'Three.js license is retained');
for(const asset of manifest.assets){
  const dataURL=pack.assets[asset.path];
  assert.match(dataURL,/^data:[^;]+;base64,/);
  const data=Buffer.from(dataURL.slice(dataURL.indexOf(',')+1),'base64');
  assert.equal(data.length,asset.bytes,asset.path);
  assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256,asset.path);
}
assert.ok(manifest.assets.some(asset=>asset.path.endsWith('moka-v1.glb')),'Realtime 3D model is embedded');
assert.ok(manifest.assets.some(asset=>asset.path==='assets/gazette-v2/coast.png'),'Illustrated gazette is embedded');
for(const [screen,page] of Object.entries(pack.pages)){
  new Script(page.js,{filename:screen+'.js'});
  assert.ok(page.js.includes('__coffeeStandalone'),'Screen uses single-file navigation: '+screen);
  assert.doesNotMatch(page.body,/<script\b|<link\b[^>]*rel="stylesheet"/);
  for(const match of page.css.matchAll(/url\(\s*(['"]?)(assets\/[^'"\s)]+)\1\s*\)/g)){
    assert.ok(pack.assets[match[2]],'Embedded CSS resource: '+match[2]);
  }
  for(const match of page.body.matchAll(/\bsrc=['"](assets\/[^'"]+)['"]/g)){
    assert.ok(pack.assets[match[1]],'Embedded initial image: '+match[1]);
  }
}
assert.doesNotMatch(html,/<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"/);
console.log(`Single HTML verified: 3 bundled screens, ${manifest.assetCount} embedded resources, ${(manifest.bytes/1024/1024).toFixed(1)} MiB, matching SHA-256.`);
