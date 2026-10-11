const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/502BadGateway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.join(__dirname,'stir-moka-bridge');
(async()=>{
 await fs.mkdir(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const state=()=>page.evaluate(()=>window.coffeeRecipeSnapshot.state);
 const shot=async name=>{
  // Capture the actual settled view, not the first transparent scene-in frame.
  if(name!=='02-mixing')await page.locator('#hero').evaluate(async el=>{
   await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));
   await Promise.all([...el.querySelectorAll('image')].map(el=>new Promise(resolve=>{const img=new Image();img.onload=img.onerror=resolve;img.src=el.getAttribute('href');})));
  });
  return page.screenshot({path:path.join(dir,name+'.png')});
 };
 const amount=async(name,n,id='A')=>{const field=page.getByRole('spinbutton',{name:id+'杯'+name+'用量'});await field.fill(String(n));await field.press('Tab');};
 try{
  await page.goto('http://127.0.0.1:4186/moka.html?order=ice&new=1');
  await page.getByRole('button',{name:'编辑全部用量 ↗'}).click();
  for(const [k,n] of [['摩卡基底',40],['水',80],['牛奶',0],['奶泡',0],['冰',40],['糖浆',0]])await amount(k,n);
  const before=await state();await shot('01-iced-before');
  await page.getByRole('button',{name:'搅拌',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('.mixing-liquid')?.dataset.progress)>.4);
  assert.ok(await page.locator('[data-action=stir]').isDisabled());
  await shot('02-mixing');
  await page.waitForFunction(()=>!document.querySelector('#hero').hasAttribute('data-mixing'));
  const after=await state();assert.deepEqual(after.cups[0].amounts,before.cups[0].amounts);assert.deepEqual(after.cups[0].allocations,before.cups[0].allocations);
  assert.equal(await page.locator('.solid-ice rect').count(),3);
  const icedColor=await page.locator('.finished-liquid').getAttribute('fill');await shot('03-iced-stirred');
  await page.getByRole('button',{name:'撤销',exact:true}).click();assert.deepEqual((await state()).cups[0].amounts,before.cups[0].amounts);
  await page.getByRole('button',{name:'成品',exact:true}).click();await amount('冰',0);assert.equal(await page.locator('.finished-liquid').getAttribute('fill'),icedColor);
  await amount('水',0);await amount('牛奶',80);await amount('冰',20);
  await page.getByRole('button',{name:'配方',exact:true}).click();await page.getByRole('button',{name:'搅拌',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('#hero').hasAttribute('data-mixing'));await shot('04-milk-stirred');
  assert.notEqual(await page.locator('.finished-liquid').getAttribute('fill'),icedColor);
  await page.getByRole('button',{name:'分成两杯',exact:true}).click();
  await page.getByRole('button',{name:'配方',exact:true}).click();
  await page.getByRole('button',{name:'搅拌',exact:true}).click();
  await page.waitForFunction(()=>!!document.querySelector('.mixing-liquid'));
  await page.getByRole('button',{name:'选择A杯'}).click();assert.equal(await page.locator('.mixing-liquid').count(),0);
  await page.getByRole('button',{name:'现做一份 ↗'}).click();
  await page.locator('.lower-diagram').waitFor();await shot('05-moka-prepare');
  await page.locator('#waterInput').fill('158');await page.getByRole('button',{name:'准备好，开始冲煮 →'}).click();assert.equal((await state()).brew.status,'prepare');
  await page.getByRole('button',{name:'演示安全水位',exact:true}).click();await page.getByRole('button',{name:'装粉',exact:true}).click();
  await page.getByRole('button',{name:'看剖面与零件 ↗'}).click();
  assert.equal(await page.locator('.exploded-diagram image[href^="assets/poster-workbench/"]').count(),6);await shot('06-moka-structure');
  for(const part of ['壶盖','上壶','上滤网','密封圈','粉篮','下壶']){
   await page.getByRole('button',{name:'了解'+part,exact:true}).click();await page.getByRole('heading',{name:part,exact:true}).waitFor();
  }
  await page.getByRole('button',{name:'收起，继续制作 →'}).click();
  await page.getByRole('button',{name:'准备好，开始冲煮 →'}).click();
  await page.locator('.brew-diagram').waitFor();
  await page.waitForFunction(()=>Number(document.querySelector('#brewOutput')?.textContent)>=30);
  await page.getByRole('button',{name:'看剖面与零件 ↗'}).click();const paused=await state();
  await page.getByRole('button',{name:'剖面',exact:true}).click();
  await page.waitForTimeout(250);assert.equal((await state()).brew.mass,paused.brew.mass);await page.getByRole('button',{name:'收起，继续制作 →'}).click();
  await shot('07-moka-brewing');
  const originalCups=(await state()).cups;
  await page.getByRole('button',{name:'关火收杯 →'}).click();
  await page.getByRole('button',{name:'把杯中基底换成这一锅 →'}).waitFor();
  const made=await state(),batch=made.batches.at(-1);assert.equal(batch.kind,'brewed');assert.deepEqual(made.cups,originalCups);
  await page.getByRole('button',{name:'把杯中基底换成这一锅 →'}).click();
  const linked=await state();assert.deepEqual(linked.cups[0].amounts,originalCups[0].amounts);assert.deepEqual(linked.cups[0].allocations,{[batch.id]:20});
  await page.getByRole('button',{name:'撤销',exact:true}).click();assert.deepEqual((await state()).cups,originalCups);
  await page.getByRole('button',{name:'把杯中基底换成这一锅 →'}).click();
  await page.locator('.batch-record>summary').click();
  await page.getByRole('button',{name:'看这把壶的结构 ↗'}).click();
  await page.getByRole('button',{name:'收起，继续制作 →'}).click();assert.equal((await page.evaluate(()=>window.coffeeRecipeSnapshot)).scene,'compare');
  await page.locator('.compare-detail>summary').click();
  await page.locator('#labToast.show').waitFor({state:'hidden'});await shot('08-made-base-linked');
  await page.getByRole('button',{name:'保存双杯作品 →'}).click();await page.getByRole('button',{name:'构图 2'}).click();
  assert.match(await page.locator('#gazetteRecord').innerText(),/自制摩卡/);
  assert.equal(await page.locator('#gazetteTitle').inputValue(),'两杯咖啡，各有来处');await shot('09-gazette-origin');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'保存本期 PNG ↗'}).click();
  const download=await downloadPromise;await download.saveAs(path.join(dir,'10-export.png'));
  const png=await fs.readFile(path.join(dir,'10-export.png'));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),1800);
  await page.setViewportSize({width:844,height:390});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),390);
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'回到调配',exact:true}).click();
  await page.getByRole('button',{name:'搅拌',exact:true}).click();assert.equal(await page.locator('.mixing-liquid').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: layered transition, solid ice, milk color, animation interruption/reduced motion, made-base workflow, structure pause, batch replacement/undo, report origin, landscape fit.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
