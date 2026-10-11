import fs from 'node:fs';
function update(path,fn){const old=fs.readFileSync(path,'utf8');fs.writeFileSync(path,fn(old));}
update('recipe-art.js',s=>s.replace(" return '<svg class=\"glass-illustration\"", " const markup='<svg class=\"glass-illustration\"")
 .replace("+(mix?spoonMarkup(c,mix.progress):'')+stream+'</svg>';", "+(mix?spoonMarkup(c,mix.progress):utensil?spoonMarkup(c,0,true):'')+stream+'</svg>';\n return markup.replace(labels?'90 61 430 405':'94 61 234 405',labels?'90 46 430 308':'94 28 234 327').replace('</defs>','</defs><g transform=\"scale(1 .76)\">').replace('</svg>','</g></svg>');"));
update('studio-entrance.js',s=>s.replace('<span class="cafe-order-number">0${index+1}</span><span>', '<span class="cafe-order-number">0${index+1}</span><img class="cafe-order-cup" src="${order.temp===\'iced\'?\'assets/cafe/cup-ice.png\':order.milk===\'none\'?\'assets/cafe/v3/cup-black.webp\':\'assets/cafe/v3/cup-milk.webp\'}" alt=""><span>')
 .replace("$('cafeArchive').hidden=!editions;", "$('cafeArchive').hidden=false;")
 .replace('`我的特刊 · ${editions} 期 ↗`', '`我的特刊册 ${editions?\'· \'+editions+\'期\':\'\'} ↗`'));
for(const path of ['studio.html','moka.html'])update(path,s=>s.replace('<link rel="stylesheet" href="coffee-fidelity.css">','<link rel="stylesheet" href="coffee-fidelity.css"><link rel="stylesheet" href="reference-fidelity.css">'));
update('moka.html',s=>s.replace('<span>做咖啡基底</span><span class="current">自由调配</span><span>出品特刊</span>','<span>做基底</span><span class="current">调配</span><span>出品</span>')
 .replace('<div class="gazette-preview">','<aside class="gazette-aside"><h1>今天的小馆特刊</h1><p>好咖啡<br>让平凡的日子<br>有了特别的味道。</p><img src="assets/reference-room/closed-moka.png" alt="本次制作使用摩卡壶"></aside><div class="gazette-preview">')
 .replace('<label class="field-label">本期标题','<label class="field-label">作品标题')
 .replace('<fieldset class="plain-fieldset"><legend>版式选择</legend><div id="gazetteLayouts" class="segments"></div></fieldset>','<fieldset class="plain-fieldset layout-format"><legend>画面内容</legend><div id="gazetteLayouts" class="segments"></div></fieldset>')
 .replace('<fieldset class="plain-fieldset"><legend>海报构图</legend>','<fieldset class="plain-fieldset composition-options"><legend>版式选择</legend>')
 .replace('导出海报 PNG ↗','↓ 保存海报 PNG').replace('收入特刊册','▱ 存入特刊册'));
update('recipe-gazette.js',s=>s.replace('width="234" height="405"','width="234" height="327"'));
