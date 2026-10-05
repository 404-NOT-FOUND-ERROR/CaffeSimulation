const {chromium}=require('C:/Users/502BadGateway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
for(const ratio of [1,1.25,1.5,2]){
 const context=await browser.newContext({viewport:{width:1460,height:830},deviceScaleFactor:ratio});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4186');await page.waitForFunction(()=>window.mokaLab?.model?.status==='ready');await page.click('[data-chapter="assembly"]');
 assert.equal(await page.getAttribute('#modelCanvas','data-finish'),'silver-black');
 const capture=()=>page.evaluate(()=>{const c=document.querySelector('#modelCanvas'),s=document.querySelector('#stage'),r=c.getBoundingClientRect();return {css:[c.clientWidth,c.clientHeight],stage:[s.clientWidth,s.clientHeight],buffer:[c.width,c.height],rect:[r.x,r.y,r.width,r.height],layout:window.mokaLab.model.getLayout()};});
 const states=[];
 for(const [width,height] of [[1460,830],[1920,1080],[1100,740],[2560,1440],[1460,830]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);const first=await capture();await page.waitForTimeout(400);const last=await capture();
  assert.deepEqual(last.css,first.css,`stable canvas CSS at DPR ${ratio}, ${width}x${height}`);assert.deepEqual(last.stage,first.stage);assert.deepEqual(last.buffer,first.buffer);
  assert.deepEqual(last.css,last.stage);assert.equal(last.layout.resizeCount,first.layout.resizeCount,'no recursive resize loop');
  assert(Math.abs(last.buffer[0]-last.css[0]*ratio)<2);assert(Math.abs(last.buffer[1]-last.css[1]*ratio)<2);
  assert(last.rect[0]+last.rect[2]<=width+1);states.push({viewport:[width,height],...last});
 }
 await page.evaluate(()=>{const b=document.createElement('button');b.id='qa-fullscreen';b.textContent='Fullscreen test';b.style.cssText='position:fixed;top:0;left:0;z-index:999';b.onclick=()=>document.documentElement.requestFullscreen();document.body.appendChild(b);});
 await page.click('#qa-fullscreen');await page.waitForFunction(()=>!!document.fullscreenElement);await page.waitForTimeout(300);const fullStart=await capture();await page.waitForTimeout(500);const fullEnd=await capture();assert.deepEqual(fullStart.css,fullEnd.css);assert.equal(fullStart.layout.resizeCount,fullEnd.layout.resizeCount);await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);await page.evaluate(()=>document.querySelector('#qa-fullscreen').remove());
 if(ratio===1.25){await page.setViewportSize({width:1600,height:1000});await page.waitForTimeout(300);await page.screenshot({path:path.join(__dirname,'review-refined-assembly.png'),fullPage:true});await page.click('[data-chapter="lab"]');await page.screenshot({path:path.join(__dirname,'review-refined-brew.png'),fullPage:true});}
 assert.deepEqual(errors,[]);report.push({ratio,states,fullscreenStable:true});await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await context.newPage();await p.goto('http://127.0.0.1:4186');await p.waitForFunction(()=>window.mokaLab?.model?.status==='ready');await p.click('[data-chapter="assembly"]');await p.screenshot({path:path.join(__dirname,'review-refined-mobile.png'),fullPage:true});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.close();
fs.writeFileSync(path.join(__dirname,'refinement-check.json'),JSON.stringify(report,null,2));await browser.close();console.log('PASS: DPR 1/1.25/1.5/2, 20 window transitions, actual fullscreen enter/exit, stable canvas sizing, refined material and mobile layout.');
})().catch(e=>{console.error(e);process.exit(1)});
