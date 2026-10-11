const path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/502BadGateway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:667,height:375}});
 try{
  await page.goto('http://127.0.0.1:4186/moka-brew.html?order=bar&new=1');
  const settled=()=>page.waitForFunction(()=>window.mokaWorkshopSnapshot&&!window.mokaWorkshopSnapshot.busy&&!window.mokaWorkshopSnapshot.moving&&!document.querySelector('#primaryAction').disabled);
  await settled();await page.getByRole('button',{name:'演示安全水位 · 120 g ↗'}).click();await settled();
  await page.locator('#primaryAction').click();await page.getByRole('button',{name:'演示装满粉篮 · 18 g ↗'}).click();await settled();
  await page.screenshot({path:path.join(__dirname,'order-brew-mix','12-small-powder-ready.png')});
  console.log(await page.locator('#primaryAction').evaluate(el=>({disabled:el.disabled,bg:getComputedStyle(el).backgroundColor,opacity:getComputedStyle(el).opacity,clip:getComputedStyle(el).clipPath})));
  await page.locator('#primaryAction').click();await settled();assert.equal(await page.evaluate(()=>window.mokaWorkshopSnapshot.state.started),true);
  await page.waitForFunction(()=>window.mokaWorkshopSnapshot.state.brewed>=12);
  await page.screenshot({path:path.join(__dirname,'order-brew-mix','13-small-brewing.png')});
  await page.locator('#primaryAction').click();await page.waitForURL(/moka\.html/,{timeout:20000});await page.locator('[data-action=split]').waitFor();
  assert.ok(await page.evaluate(()=>window.coffeeRecipeSnapshot.state.cups[0].amounts.coffee>=12));
  console.log('PASS: safe water, fill, start brew, and collect use actual clickable controls at 667x375.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
