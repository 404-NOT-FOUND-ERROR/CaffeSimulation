const {chromium}=require('C:/Users/502BadGateway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let report=[];
for(const dpr of [1,1.25,2]){
 const context=await browser.newContext({viewport:{width:1460,height:830},deviceScaleFactor:dpr});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4186');await page.waitForFunction(()=>window.mokaLab?.model?.status==='ready');await page.click('[data-chapter="assembly"]');
 const readings=[];
 for(let i=0;i<5;i++){await page.waitForTimeout(250);readings.push(await page.evaluate(()=>{const c=document.querySelector('#modelCanvas'),s=document.querySelector('#stage');return {canvas:[c.clientWidth,c.clientHeight,c.width,c.height],stage:[s.clientWidth,s.clientHeight],pageHeight:document.documentElement.scrollHeight}}));}
 report.push({dpr,readings});await context.close();
}
console.log(JSON.stringify(report,null,2));fs.writeFileSync(path.join(__dirname,'resize-baseline.json'),JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
