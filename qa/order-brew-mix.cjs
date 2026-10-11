const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/502BadGateway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.join(__dirname,'order-brew-mix'),root='http://127.0.0.1:4186/';
const sizes=[{width:1920,height:1080},{width:1536,height:864},{width:1366,height:768},{width:1280,height:720},{width:1024,height:600},{width:844,height:390},{width:667,height:375}];
(async()=>{
 await fs.mkdir(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:sizes[2]}),errors=[],layouts=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(root))errors.push(r.status()+' '+r.url());});
 const recipe=()=>page.evaluate(()=>window.coffeeRecipeSnapshot.state);
 const pot=()=>page.evaluate(()=>window.mokaWorkshopSnapshot);
 const settled=()=>page.waitForFunction(()=>window.mokaWorkshopSnapshot&&!window.mokaWorkshopSnapshot.busy&&!window.mokaWorkshopSnapshot.moving);
 const shot=async name=>{await page.screenshot({path:path.join(dir,name+'.png')});};
 async function checkLayouts(label){
  for(const size of sizes){
   await page.setViewportSize(size);
   const m=await page.evaluate(()=>{
    const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'&&!e.closest('[inert]');
    const rect=e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:(e.textContent||e.id).trim().slice(0,45),x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height,clickable:e.disabled||e===hit||e.contains(hit)};};
    const selectors=window.mokaWorkshopSnapshot?'#primaryAction,#tools button,#controlBody button,#controlBody input,#structureToggle,#insideViews button,#contextToggle':'.control-dock button,#ingredientTray button,.export-actions button,.cup-choice';
    return {w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,controls:[...document.querySelectorAll(selectors)].filter(visible).map(rect)};
   });
   assert.ok(m.sh<=m.h+1,`${label} ${size.width}: document overflow ${m.sh}/${m.h}`);
   assert.ok(m.sw<=m.w+1,`${label} ${size.width}: horizontal overflow`);
   for(const r of m.controls){assert.ok(r.x>=0&&r.y>=0&&r.right<=m.w+1&&r.bottom<=m.h+1,`${label} ${size.width}: offscreen ${JSON.stringify(r)}`);assert.ok(r.clickable,`${label} ${size.width}: covered control ${JSON.stringify(r)}`);}
   layouts.push({label,...m});
   if([1366,667].includes(size.width))await shot(label+'-'+size.width);
  }
  await page.setViewportSize(sizes[2]);
 }
 async function amount(name,n,id='A'){
  const field=page.getByRole('spinbutton',{name:id+'杯'+name+'用量'});
  await field.fill(String(n));await field.press('Tab');
 }
 try{
  await page.goto(root+'studio.html');
  const order=await page.locator('#cafeOrders [data-order]').first().getAttribute('data-order');
  await page.locator('#cafeOrders [data-order]').first().click();
  await page.waitForURL(/moka-brew\.html/);await settled();
  assert.equal(new URL(page.url()).searchParams.get('order'),order);
  const session=new URL(page.url()).searchParams.get('session');
  assert.equal(await page.locator('#lab').count(),0);
  assert.equal((await pot()).state.poured,0);
  await checkLayouts('01-water');
  await page.locator('#waterAmount').fill('158');await settled();
  await page.locator('#primaryAction').click();await page.getByRole('button',{name:'演示装满粉篮 · 18 g ↗'}).click();await settled();
  await checkLayouts('02-powder');
  await page.locator('#primaryAction').click();
  assert.equal((await pot()).state.started,false);assert.match(await page.locator('#controlFeedback').textContent(),/安全阀/);
  await page.getByRole('button',{name:'水位',exact:true}).click();
  await page.getByRole('button',{name:'演示安全水位 · 120 g ↗'}).click();await settled();
  await page.locator('#primaryAction').click();
  assert.ok(Math.abs((await pot()).state.powder-18)<.01);
  await page.locator('[data-grind="0"]').click();
  await page.locator('#primaryAction').click();await settled();
  assert.equal((await pot()).state.started,true);
  await checkLayouts('03-brewing');
  await page.locator('#structureToggle').click();
  const paused=(await pot()).state.progress;await page.waitForTimeout(200);assert.equal((await pot()).state.progress,paused);
  await checkLayouts('04-section');
  await page.locator('[data-inside-view="structure"]').click();
  for(const part of ['lower','basket','filter','gasket','upper','lid'])await page.locator('.part-choices [data-inspect="'+part+'"]').click();
  await checkLayouts('05-structure');
  await page.locator('#contextToggle').click();
  await page.waitForFunction(()=>window.mokaWorkshopSnapshot.state.brewed>=45,{},{timeout:45000});
  const madeBefore=await pot();assert.equal(madeBefore.state.grind,0);
  await page.locator('#primaryAction').click();
  await page.waitForURL(/moka\.html/,{timeout:20000});await page.locator('[data-action="split"]').waitFor();
  const made=await recipe(),batch=made.batches[0];
  const collected=await page.evaluate(id=>JSON.parse(localStorage.getItem('coffee-moka-session-'+id)).state,session);
  assert.equal(made.orderId,order);assert.equal(batch.record.workshopSession,session);assert.equal(batch.record.grind,0);
  assert.equal(made.batches.length,1);assert.equal(batch.kind,'brewed');
  assert.equal(made.cups[0].amounts.coffee,Math.round(collected.poured*10)/10);
  assert.equal(batch.capacity,made.cups[0].amounts.coffee);assert.deepEqual(made.cups[0].allocations,{[batch.id]:batch.capacity});
  for(const [k,n] of Object.entries(made.cups[0].amounts))if(k!=='coffee')assert.equal(n,0);
  assert.equal(collected.heat,0);assert.equal(collected.onStove,false);assert.equal(collected.stirred,true);
  await page.getByRole('button',{name:'编辑全部用量 ↗'}).click();
  await amount('摩卡基底',40);await amount('水',80);await amount('冰',40);
  await checkLayouts('06-mix');
  const before=await recipe();await page.getByRole('button',{name:'搅拌',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('.mixing-liquid')?.dataset.progress)>.4);await shot('07-mixing');
  await page.waitForFunction(()=>!document.querySelector('#hero').hasAttribute('data-mixing'));
  assert.deepEqual((await recipe()).cups[0].amounts,before.cups[0].amounts);
  assert.equal(await page.locator('.solid-ice rect').count(),3);
  const icedColor=await page.locator('.finished-liquid').getAttribute('fill');
  await amount('冰',0);assert.equal(await page.locator('.finished-liquid').getAttribute('fill'),icedColor);
  await amount('水',0);await amount('牛奶',80);await page.getByRole('button',{name:'配方',exact:true}).click();
  await page.getByRole('button',{name:'搅拌',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#hero').hasAttribute('data-mixing'));
  assert.notEqual(await page.locator('.finished-liquid').getAttribute('fill'),icedColor);await shot('08-milk');
  await page.getByRole('button',{name:'分成两杯',exact:true}).click();await checkLayouts('09-two-cups');
  await page.locator('.batch-record>summary').click();
  const preserved=await recipe();await page.getByRole('button',{name:'看这把壶的结构 ↗'}).click();
  await page.waitForURL(/moka-brew\.html/);await settled();assert.equal(new URL(page.url()).searchParams.get('session'),session);
  assert.equal((await pot()).view,'structure');await page.locator('#contextToggle').click();
  await page.waitForURL(/moka\.html/);await page.locator('.two-cups').waitFor();assert.deepEqual((await recipe()).cups,preserved.cups);
  await page.reload();await page.locator('.two-cups').waitFor();assert.deepEqual((await recipe()).cups,preserved.cups);
  // Re-entering the completed first batch must not duplicate it or reset either cup.
  await page.goto(root+'moka-brew.html?order='+order+'&session='+session);await settled();
  await page.getByRole('button',{name:'开始加料 →'}).click();await page.waitForURL(/moka\.html/);await page.locator('.two-cups').waitFor();
  assert.equal((await recipe()).batches.length,1);assert.deepEqual((await recipe()).cups,preserved.cups);
  // A partial refill can be parked, then resumed with its quantities intact.
  await page.getByRole('button',{name:'再做一锅 ↗'}).click();await page.waitForURL(/moka-brew\.html/);await settled();
  const pending=new URL(page.url()).searchParams.get('session');assert.notEqual(pending,session);
  await page.locator('#waterAmount').fill('115');await settled();
  await page.getByRole('link',{name:'← 回到调配'}).click();await page.waitForURL(/moka\.html/);await page.locator('.two-cups').waitFor();
  assert.equal((await recipe()).pendingWorkshopSession,pending);
  await page.getByRole('button',{name:'继续这一锅 ↗',exact:true}).click();await page.waitForURL(/moka-brew\.html/);await settled();
  assert.equal(new URL(page.url()).searchParams.get('session'),pending);assert.equal(Math.round((await pot()).state.water),115);
  await page.locator('#primaryAction').click();await page.getByRole('button',{name:'演示装满粉篮 · 18 g ↗'}).click();await settled();
  await page.locator('#primaryAction').click();await settled();
  await page.waitForFunction(()=>window.mokaWorkshopSnapshot.state.brewed>=30,{},{timeout:45000});
  await page.locator('#primaryAction').click();await page.waitForURL(/moka\.html/,{timeout:20000});await page.locator('.two-cups').waitFor();
  const refilled=await recipe();assert.equal(refilled.batches.length,2);assert.equal(refilled.pendingWorkshopSession,undefined);
  assert.equal(refilled.batchId,'workshop-'+pending);assert.deepEqual(refilled.cups,preserved.cups);
  assert.ok(refilled.batches[1].capacity>=30);assert.equal(refilled.batches[1].record.water,115);
  // Dropping the order preserves the same coffee and its original apparatus record.
  await page.getByRole('button',{name:'放回来单，自由发挥 ↗'}).click();assert.equal((await recipe()).orderId,null);
  await page.locator('.batch-record>summary').click();await page.getByRole('button',{name:'看这把壶的结构 ↗'}).click();
  await page.waitForURL(/moka-brew\.html/);await settled();assert.ok((await pot()).state.poured>=30);
  await page.locator('#contextToggle').click();await page.waitForURL(/moka\.html/);await page.locator('.two-cups').waitFor();assert.equal((await recipe()).orderId,null);
  await page.goto(root+'moka-brew.html?order='+order+'&session='+session);await settled();await page.getByRole('button',{name:'开始加料 →'}).click();
  await page.waitForURL(/moka\.html/);await page.locator('.two-cups').waitFor();assert.equal((await recipe()).orderId,null);assert.equal(new URL(page.url()).searchParams.get('order'),null);
  assert.deepEqual((await recipe()).cups,preserved.cups);assert.equal((await recipe()).batches.length,2);
  await page.getByRole('button',{name:'保存双杯作品 →'}).click();await checkLayouts('10-gazette');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'保存本期 PNG ↗'}).click();const download=await downloadPromise;
  await download.saveAs(path.join(dir,'11-export.png'));const bytes=await fs.readFile(path.join(dir,'11-export.png'));assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),1800);
  await page.goto(root+'studio.html');await page.locator('.cafe-free-note').click();await page.waitForURL(/moka-brew\.html/);await settled();
  assert.equal(new URL(page.url()).searchParams.get('order'),null);assert.equal((await pot()).state.started,false);
  await page.goto(root+'moka.html?order=bar&new=1');await page.waitForURL(/moka-brew\.html/);await settled();assert.equal((await pot()).state.started,false);
  await page.setViewportSize({width:390,height:844});await page.reload();await settled();
  const portrait=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(portrait.sw<=portrait.w+1);
  await page.goto(root+'moka-legacy.html');await settled();assert.equal(await page.locator('#workshop').getAttribute('data-flow'),null);
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(dir,'layout-results.json'),JSON.stringify(layouts,null,2));
  console.log('PASS: order -> original Moka preparation / science / brew / collected coffee -> ingredients / stirring / split / gazette; structure return, reload, idempotency, parked refill, free entry, legacy, PNG; '+layouts.length+' viewport checks.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
