# 咖啡工作室入口概念第二版

本次使用内置 image_gen 生图；属于供用户审核的页面设计概念。

## 用户修正

第一版首页与器具选择页显得过老，中文字体与做旧质感让其偏向中国 80 年代招贴，且缺少与后续操作页面的视觉传承。

## 本次调整

- 直接参考已认可的加水页概念，以及当前操作页。
- 界面统一使用奶油白、铜橙、深咖色；器具沿用细腻银色材料。
- 中文改为现代几何无衬线，缩小器具页标题相对比例。
- 保留意式广告的斜向构图、巨大压缩拉丁字和克制的图形偏移阴影。
- 减轻纸张纹理，去掉海岸风景、摩托车等偏离平台内容的怀旧布景。
- 首页改用成品杯作主视觉、底部横向来单；接单后的页以需求与器具选择为主。
- 操作流程不新增确认、入门模式或独立科普入口。

## 页面实现

文字和操作控件使用真实 HTML；几何背景、细线、斜角按钮使用 CSS。杯子和器具作为独立渲染素材或固定视角模型展示。首页点击订单/自由创作后进入器具选择，选择摩卡壶后直接进入操作场景。

概念图中的大小、材质和文案需要在实现时按实际可视区域进一步校正，图片不充当整个页面的交互背景。

## 保存的概念图

- assets/concepts/studio-homepage-concept-02.png
- assets/concepts/studio-equipment-concept-02.png

## 首页完整提示词

Use case: ui-mockup.
Asset type: a revised high-fidelity desktop HOME page concept for a Chinese interactive coffee studio and science experience. One flat front-on website screen, landscape 1600 x 1000 composition, no browser chrome or monitor frame.

Reference roles:
Image 1 is the APPROVED later Moka preparation-page concept: this is the primary style anchor. Inherit its precise cream / copper / espresso color system, clean modern geometric Chinese sans-serif, oblique monumental Latin lettering with a restrained offset graphic shadow, bold diagonal field, slender rules, and realistic silver material. It is not the homepage layout.
Image 2 is the actual implemented preparation page: preserve visible visual continuity to its typography, cream background and copper diagonal. Do not reproduce its laboratory controls.
Image 3 is the user's authentic Italian FIAT poster reference wall: borrow disciplined Art Deco geometry, dramatic Italian lettering scale and sophisticated asymmetric composition. Do not imitate the wall, frames or photography.

Primary request: redesign the homepage after the previous concepts felt too old and like generic 1980s Chinese posters. The correct direction is a refined contemporary interactive interface descended from Italian Art Deco advertising. Elegant, bold, precise, airy. Its main image is a finished cup of coffee. Its interactions are random incoming orders or free creation. Let it feel welcoming and creatively promising while belonging to the same visual system as the later Moka page.

Palette: exactly warm light cream #f4ecdd, dark espresso #302016, elegant copper orange #b65c38; light silver and warm white on objects. Clean solid cream background, almost imperceptible fine matte surface, no visible mottled paper ageing, no yellow stains, no worn ink. No petrol teal, mustard, burgundy or other new dominant home palette.

Composition: freely arranged editorial hero in the upper roughly 70 percent and a compact horizontal incoming-order area in the lower roughly 18 percent, with generous cream negative space and comfortable 70-90px page margins. This is NOT the operation-page three-column layout. Upper-left very small letterspaced masthead "OFFICINA DEL CAFFÈ" and small "咖啡工作室", only discreet text, no navbar.
Hero left: assertive modern geometric Chinese sans-serif headline "这一杯，" on first line and "由你创作。" on second, about 80px type at this desktop scale. This must look like the strong clean sans-serif of reference 1, with regular modern glyph structure; no Song/Ming serifs, no brush strokes, no retro Chinese display calligraphy, no distressed type. Well-kerned, dark espresso, gently angled baseline is fine. Small clear subtitle "接一张来单，或自由做一杯。" with wide surrounding air. Below, a compact deep-espresso square/cut-corner button "自由创作 →", no extra onboarding entrance.
Hero right/center: an extraordinary single warm-white porcelain coffee cup with dark brown coffee and a matching saucer, refined studio product render with realistic ceramic thickness and controlled soft directional light, no branding, no lettering on the cup, no latte art. A slim silver teaspoon is the only supporting object, matching the silver material of the Moka page. The cup and saucer can be slightly angled as an advertising composition, but must remain physically plausible. They sit in front of one clean large copper-orange diagonal graphic plane and a restrained circular shape, not in a real café. Huge tightly condensed italic Latin "CAFFÈ" on the diagonal behind the cup, cream face and slim espresso/copper offset geometric shadow, echoes reference 1's "ACQUA" treatment. Beautiful intentional cropping, no letter overlapping live buttons or body copy. The whole cup illustration occupies less than 35 percent of the screen area, not a giant closeup filling the whole image. Use bold negative-space composition, not a rich ornamental painting.

Lower order area is compact and visibly interactive: small left label "今日来单"; small right text "换一批 ↻". Three horizontal cream order tickets across the lower width, separated by generous gaps and restrained fine rules. They may have a tiny clipped/ripped lower corner echoing the small order ticket in reference 1, but not huge serrated edges or faux-old receipts. First ticket "01 / 早餐搭档" with smaller description "热奶咖 · 牛奶多一些" and a small arrow. Second "02 / 厨房来客" with "摩卡壶 · 原液黑咖" and small arrow. Third "03 / 清爽冰咖" with "冰黑咖 · 不加奶" and small arrow. Numbers may use the same elegant small serif as the order number on reference 1. Ticket names use clean modern Chinese sans-serif, around 24px. Whole ticket is the click target. They are lightweight paper-layout elements, not thick boxed dashboard cards, not another immersive lesson.
A very small footer sentence in light espresso can say "每一杯，都有一份自己的特刊。", without any giant gallery or new button.

Constraints: accurately readable Chinese; strong hierarchy in scale, plenty of breathing room. Real live controls and text are separable HTML; diagonal, circular geometry, fine lines and cut-corner buttons feasible in CSS; coffee product artwork feasible as a separate raster/render asset with subtle parallax. No workbench model, no extraction data, no sliders, no charts, no stepper. No Italian coastline, scooter, flowers, rays, olive branches, hand-lettered slogans, random decorative cup text, retro postcard collage, overt vintage grain, theatrical spotlights or oily photoreal materials. Do not add top navigation. The Italian refinement comes from typography and composition, not nostalgia props. The page must visibly belong to the same family as references 1 and 2.

## 器具选择页完整提示词

Use case: ui-mockup.
Asset type: the revised SECOND desktop webpage concept for the same interactive coffee studio: the page reached after clicking the homepage incoming order "早餐搭档". One flat front-on 1600 x 1000 landscape website screen, no browser chrome, no multi-screen collage.

Reference roles:
Image 1 is the NEW revised homepage, PRIMARY typography/color/material reference. Preserve its strong clean contemporary Chinese sans-serif, cream / copper orange / espresso visual system, controlled oblique Latin typography, finely finished studio coffee objects, thin graphic rules and clipped-corner action.
Image 2 is the approved later Moka preparation-page concept, SECONDARY continuity reference. Inherit the realistic silver Moka materials, small refined order ticket, clean cream paper and sculptural graphic diagonal treatment. Do not copy its action controls.
Image 3 is the actual Moka preparation screenshot, use for continuity of the real interface. This equipment-choice page must feel like the same product. Do not reproduce the brewing laboratory.

Primary request: refined Italian Art Deco advertising typography and geometric composition adapted to a contemporary, beautifully spaced equipment-choice interface. Previous proposals were rejected because heavy vintage grain and old Chinese serif display typography looked like 1980s Chinese advertising. Correct that decisively: clean modern sans-serif Chinese, no old Song/Ming serifs, no brush characters, no decorative Chinese poster lettering, no yellowing or mottled grain. The Italian elegance comes from scale, proportion, careful type, diagonal geometry, silver materials and negative space.

Palette strictly cream #f4ecdd, dark espresso #302016, copper orange #b65c38, restrained silver and warm white on apparatus. No dominant teal, yellow, gold patchwork or other unrelated palette. Espresso machine can be deep espresso brown and silver. Absolutely no commercial brand logos or wordmarks on any cup or equipment.

Layout: most of screen is quiet clean warm cream with generous margins and gaps. Small text return link upper left "← 返回工作室". No navbar. On the left about 25 percent of width is a concise accepted-order brief; to the right about 67 percent is an open borderless apparatus exhibition. Do not fill it with three dashboard cards. Don't make title text huge. Keep typography confidently modern but more restrained than the home page.

Left brief: small copper eyebrow "已接下来单 / 01"; main modern bold sans Chinese title "早餐" and "搭档" on two lines, about 65px type, airy leading. Below a small quote "想喝一杯奶多的热咖啡，约200g。" and a fine horizontal rule; compact spec line "热饮 / 约200g / 牛奶多一些". A small finished milk coffee in a warm-white cup and saucer lower in this column, about 180px wide, simple light-brown smooth surface without latte art. Render the cup like the clean ceramic in reference 1, no cup lettering. Keep big space around it. One small note "先做咖啡，再决定怎么加奶。"

Right top: quiet small Latin "SCEGLI IL TUO METODO" with delicate tracking. Main Chinese heading "这杯咖啡，怎么做？", about 45-50px, geometric sans and dark espresso. Small helper line "选好器具，就开始动手。". Then a single row of three elegant apparatus choices with generous gaps, each object isolated on cream, shared subtle ground-light direction and very soft contact shadows. Refined object proportions, realistically buildable models. One shallow copper diagonal graphic plane behind the first Moka choice connects visually to the later preparation stage; it must be clean and geometric, not a large backdrop that overpowers the gallery. A condensed oblique ivory "MOKA" may sit on that plane, partially hidden behind the pot, with a restrained offset shadow like reference 2. The other two objects have much more ivory air behind them.

First choice, emphasis but not enormous: a beautifully finished upright classic octagonal Moka pot, brushed aluminium facets, slight rounded bevels and actual ceramic-free metal, black handle and lid knob, a brass pressure valve, physically correct assembly; a complete pot about 280-310px tall with all components aligned along one vertical axis. Strong but pale silver highlights, no tinted chrome and no branding. Below: tiny "01 / MOKA"; clean modern Chinese title "摩卡壶" at about 25px; small explanation "炉火加热 · 压力差送水"; compact dark-espresso cut-corner button with cream text "用摩卡壶制作 →". Button height about 46px and width 240px. This click is the actual apparatus selection and enters making immediately; it is not a separate confirmation step.

Second choice: slightly smaller white ceramic pour-over filter with a believable paper filter and coffee grounds, atop a clear glass server with dark coffee. Accurate filter/server scale. Below: tiny "02 / FILTRO"; title "手冲滤杯 ↗", about 25px; explanation "手动注水 · 重力过滤". Clicking the image or title selects that apparatus directly. No big duplicate CTA.

Third choice: slightly smaller compact classic espresso machine, espresso brown enamel and neutral silver metal, plausible portafilter locked in its group and a small white cup below. No invented complex gears or excessive gauges. Below: tiny "03 / ESPRESSO"; title "意式咖啡机 ↗", about 25px; explanation "水泵加压 · 小份萃取". Image/title is the direct alternative choice. No big duplicate CTA.

Typography and air: use the reference 1 modern sans exactly in spirit. Body around 14-16px with fine, precise weights. No serif Chinese anywhere. Small Latin display and order numeral may be tasteful serif but must not contaminate the Chinese. Maintain roughly 30 percent total unused cream negative space. No large footer, no bottom five-step navigation, no experiment controls, no graphs, no preset scores, no independent teaching-mode entrances or required structure tour. No fake simulated coffee chemistry claims. All interface text and buttons should plausibly be implemented as HTML/CSS; objects are separate rendered images or restrained fixed-view 3D. Include accurately readable Chinese. The finished concept must feel clean and contemporary with inherited Italian poster character, not a vintage print recreation or a product catalog photo montage.
