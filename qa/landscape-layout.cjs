// Browser-level regression: the page fits; expanding reading panels cannot
// push the ingredient tray or the primary action outside the viewport.
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/502BadGateway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output=path.join(__dirname,'landscape-layout');
const sizes=[{width:1920,height:1080},{width:1536,height:864},{width:1366,height:768},{width:1280,height:720},{width:1024,height:600},{width:844,height:390},{width:667,height:375}];
async function measure(page,label){
 const m=await page.evaluate(()=>{
  const root=document.documentElement,visible=e=>!e.closest('[hidden]')&&e.getBoundingClientRect().width>0;
  const bounds=e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label')||e.textContent.trim().slice(0,35),x:Math.round(r.left),y:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom)};};
  return {width:innerWidth,height:innerHeight,scrollWidth:root.scrollWidth,scrollHeight:root.scrollHeight,scene:document.querySelector('#lab')?.dataset.scene||document.querySelector('.studio')?.dataset.page,
   controls:[...document.querySelectorAll('#controlDock button,#ingredientTray button,.export-actions button,.water-control input,.cup-choice,#cafeOrders button,.cafe-free-note,.method-enter')].filter(visible).map(bounds),
   art:[...document.querySelectorAll('#hero>svg,.single-cup-art>svg,.cup-choice>svg,#lowerArt>svg,#gazetteCanvas')].filter(visible).map(bounds),
   panels:[...document.querySelectorAll('.details,.editorial,.gazette-record')].filter(visible).map(e=>({...bounds(e),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}))};
 });
 console.log(`${label}: ${m.scrollWidth}x${m.scrollHeight}`);
 assert(m.scrollHeight<=m.height+1,`${label}: vertical page overflow ${m.scrollHeight}/${m.height}`);
 assert(m.scrollWidth<=m.width+1,`${label}: horizontal page overflow ${m.scrollWidth}/${m.width}`);
 for(const c of m.controls)assert(c.y>=0&&c.bottom<=m.height+1&&c.x>=0&&c.right<=m.width+1,`${label}: offscreen control ${JSON.stringify(c)}`);
 for(const a of m.art)assert(a.bottom<=m.height+1&&a.y>=0&&a.bottom-a.y>30,`${label}: offscreen or collapsed artwork ${JSON.stringify(a)}`);
 return {label,...m};
}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:sizes[0]});const results=[];
 try{
  await page.goto('http://127.0.0.1:4186/moka.html?new=1&order=share');
  await page.getByRole('heading',{name:'这一杯的配方'}).waitFor();
  await page.getByRole('button',{name:'编辑全部用量 ↗'}).click();
  for(const size of sizes){
   await page.setViewportSize(size);
   await page.goto('http://127.0.0.1:4186/moka.html?order=share');
   await page.getByRole('heading',{name:'这一杯的配方'}).waitFor();
   await page.getByRole('button',{name:'编辑全部用量 ↗'}).click();
   for(const [name,value] of [['摩卡基底','40'],['牛奶','80'],['水','30'],['奶泡','10'],['冰','10'],['糖浆','2']]){
    const field=page.getByRole('spinbutton',{name:'A杯'+name+'用量'});await field.fill(value);await field.press('Tab');
   }
   results.push(await measure(page,`${size.width}x${size.height} recipe-expanded`));
   if(size.width===1366)await page.screenshot({path:path.join(output,'recipe-1366x768.png')});
   await page.getByRole('button',{name:'分成两杯',exact:true}).click();
   await page.locator('.compare-detail summary').click();
   results.push(await measure(page,`${size.width}x${size.height} compare-expanded`));
   await page.getByRole('button',{name:'现做一份 ↗'}).click();
   results.push(await measure(page,`${size.width}x${size.height} prepare`));
   await page.getByRole('button',{name:'看剖面与零件 ↗'}).click();
   results.push(await measure(page,`${size.width}x${size.height} structure`));
   await page.getByRole('button',{name:'收起，继续制作 →'}).click();
   await page.getByRole('button',{name:'演示安全水位',exact:true}).click();
   await page.getByRole('button',{name:'装粉',exact:true}).click();
   await page.getByRole('button',{name:'准备好，开始冲煮 →'}).click();
   await page.getByRole('heading',{name:'正在受热'}).waitFor();
   results.push(await measure(page,`${size.width}x${size.height} brewing`));
   if(size.width===1366){await page.locator('#labToast.show').waitFor({state:'hidden'});await page.screenshot({path:path.join(output,'brewing-1366x768.png')});}
   await page.getByRole('link',{name:'← 回到这一杯'}).click();
   await page.getByRole('button',{name:'保存双杯作品 →'}).click();
   await page.locator('#gazetteCanvas').waitFor();
   await page.getByRole('button',{name:'构图 2'}).click();
   results.push(await measure(page,`${size.width}x${size.height} gazette`));
   if([1366,844].includes(size.width)){await page.locator('#labToast.show').waitFor({state:'hidden'});await page.screenshot({path:path.join(output,`gazette-${size.width}x${size.height}.png`)});}
   // A fresh session for the next size, so every run exercises single -> split.
   await page.goto('http://127.0.0.1:4186/moka.html?order=share&new=1');
   await page.goto('http://127.0.0.1:4186/studio.html');
   await page.locator('.cafe-order').first().waitFor();
   results.push(await measure(page,`${size.width}x${size.height} lobby`));
   if([1366,844].includes(size.width))await page.screenshot({path:path.join(output,`lobby-${size.width}x${size.height}.png`)});
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4186/moka.html?order=share&new=1');
  await page.getByRole('heading',{name:'这一杯的配方'}).waitFor();
  const portrait=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight}));
  assert(portrait.scrollWidth===portrait.width,'Portrait must not overflow horizontally');
  assert(portrait.scrollHeight>portrait.height,'Portrait retains natural scrolling');
  results.push({label:'portrait',...portrait});
  await fs.writeFile(path.join(output,'measurements.json'),JSON.stringify(results,null,2));
  console.log(`PASS: ${results.length-1} landscape scene checks + portrait regression`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
