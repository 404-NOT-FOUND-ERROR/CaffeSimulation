# 咖啡工作室首页与接单后页面：概念图提示词

使用内置 image_gen 生图。两张图用于审核，尚未应用到网站。

## 页面关系

首页选择一张随机来单，或自由创作 → 选择器具 → 摩卡壶制作场景。
第二张图使用首页的「早餐搭档」来单，不新增学习模式或独立的新手入口。

首页强调咖啡作品、接单与最终特刊；器具页强调客人需求和器具选择。沿用意式广告海报的字形与图形语言，采用更清晰的页面分工。

## 实现方式

- 文案、订单、返回链接、器具选择和制作按钮使用真实 HTML，不能烘焙在背景中。
- 意式海报插画可以作为独立视觉资产；斜边、色块、细线与排版可以用 CSS 实现。
- 器具展示可以使用独立渲染图或已有 3D 模型的固定视角；不要求所有页面都运行实时 3D。
- 首页三个来单可替换，整行可点击；自由创作走同一器具选择页。
- 器具选项直接进入制作，不增加确认步骤。
- 生图中的器具品牌标识及装饰文字只属概念图内容，落地时使用项目自己的素材与文案。
- 特刊小图展示同一杯饮品的不同海报风格；不将界面配色强加给导出海报。

## 首页完整提示词

Use case: ui-mockup.
Asset type: one high-fidelity desktop homepage concept for a Chinese interactive coffee science HTML experience. One flat, front-on website screen, landscape 1600 by 1000 composition. No browser chrome, no monitor mockup, no multi-screen collage.

Primary request: design a truly inviting, playful coffee studio homepage. Visitors choose one of three random incoming orders OR free creation, then choose equipment. This home must have a distinctly different composition and emotional tone from the later cream/copper Moka preparation laboratory. Make a bold, airy Italian vintage advertising art direction inspired by 1930s FIAT geometric lettering and 1950s-60s Italian café / Vespa screen-printed posters. It should feel like a great art-directed interactive publication, readily buildable with HTML typography, CSS shapes, click targets, and a decorative illustration asset. Not an ordinary dashboard or coffee e-commerce shop.

Composition: spacious ivory canvas with very discreet small masthead at upper left "OFFICINA DEL CAFFÈ" and Chinese "咖啡工作室"; no navigation bar. A dramatic editorial hero fills the left 60 percent, while a clearly usable order menu occupies the right 30 percent, with a generous gap between them. Plenty of blank paper margins. The left hero has a large dark-petrol Chinese headline "今天，开张！" above a colorful geometric café poster artwork. Inside the artwork oversized condensed italic ivory Latin "CAFFÈ", an offset mustard shadow and a small vermilion sun disc are layered around one expressive large ivory porcelain cup of coffee and a couple of smaller differently shaped coffee glasses. Use a sophisticated stylized 2.5D illustration with limited flat printed shades, broad simple shapes, NO greasy photoreal café scene, no café furniture. Finished drinks are the hero, not a giant Moka pot. Distinct petrol-blue / deep teal block, warm paper, coral-vermilion accent, a little golden ochre; espresso ink text. The artwork can crop deliberately like a period poster without obscuring the actual interactive order menu. Hint of very fine paper grain, clean edges, controlled graphic shadow. Large headline and clean small supporting line: "接一张来单，或自由做一杯。"

Right menu: heading "今日来单" with small "换一批 ↻" on the same line. Three clear, compact rectangular paper order tickets separated by thin rules, not rounded dashboard cards. Very restrained paper layering, no heavy drop shadows. Each entire ticket is a click target, simple small arrow on its right. Exact ticket text:
"01" / "早餐搭档" / "热奶咖 · 牛奶多一些"
"02" / "厨房来客" / "摩卡壶 · 原液黑咖"
"03" / "清爽冰咖" / "冰黑咖 · 不加奶"
First order subtly accented in vermilion to suggest hover, not already selected. Distinguish order names clearly from smaller descriptors. Under the tickets give one compact vermilion graphic button or underlined primary text link "自由创作 →", with little helper line "器具和配方，由你决定。" No other entry modes.

At bottom, a narrow elegant editorial preview about the eventual output, around 12 percent of screen height, never a huge footer: heading "这一杯，会成为你的特刊。" and two or three SMALL miniature Italian coffee poster covers with boldly varied cobalt, olive and burgundy palettes, all using the SAME simple finished milk coffee cup as a recipe-invariant style demonstration. These are example covers, not another required step or a large card gallery. Keep lots of whitespace around them. No mandatory stepper, no brew measurements, no models on a workbench, no coffee stats, no graphs, no XP/rewards, no tutorial-mode selector, no start-first-cup entrance, no top navigation tabs, no bottom navigation bar.

Typography: assertive modern Chinese black type for large heading, highly legible refined Chinese for menu, condensed italic 20th-century Italian display Latin in artwork, small elegant serif masthead. Vintage graphic confidence with modern usability, precise spacing and breathing room. Buttons and all menu text inherit the graphic poster style using square corners and small diagonal accents. All Chinese text correctly legible. This is a concept of an implementable webpage, not a photographed physical poster.

## 接单后器具选择页完整提示词

Use case: ui-mockup.
Asset type: a SECOND high-fidelity desktop page concept for the same Chinese interactive coffee science HTML experience. A flat front-on implementable website screen, landscape 1600 by 1000 composition. One screen only, no browser chrome, no screen collage.

Input image 1: STYLE REFERENCE ONLY, the newly designed coffee studio homepage. Carry across its refined Italian advertising art direction, petrol ink, warm ivory, vermilion accents, ochre sparingly, square graphic details and confident typographic character. Do not copy its layout. The second page should deliberately be quieter and more spacious, with equipment becoming the hero and far less decorative density. Chinese typography must remain highly legible.

Primary request: the actual page reached by clicking the homepage incoming order "早餐搭档". The visitor has already accepted the order. This is the equipment-choice page, before hands-on preparation. Choose equipment directly; choosing Moka leads straight into the making scene. Show the order clearly and let three useful apparatus options be explored. No new entrance, no beginner mode, no separate knowledge-tour button, no mandatory stepper and no recipe controls at this point.

Composition: an airy ivory editorial exhibition, very broad margins, about 30 percent left column for the accepted order and 65 percent right area for a gorgeous borderless equipment display, with a generous white gutter and a thin elegant vertical rule. The screen is mostly unfilled warm paper. Small text-only return link upper left "← 返回工作室"; absolutely no top navigation bar. A small serif Latin running title at upper right "TRE MODI, UNA TAZZA". Keep the main content around the middle with breathable vertical space and a light lower margin, no oversized footer.

Left column is a compact editorial guest order, not an app card stack: small vermilion eyebrow "已接下来单 / 01"; strong two-line Chinese title "早餐" then "搭档", very large but not overpowering. Below it a short quotation in crisp readable Chinese: "早上想喝一杯奶多的热咖啡，约200g。" A thin rule and three short specification labels "热饮" / "约200g" / "牛奶多一些". Lower in this column show a beautiful medium-small illustrated porcelain cup of light-brown milk coffee on a saucer, in the same printed café-poster treatment as the reference, without latte art, no invented milk foam effect, no photoreal café backdrop. Small local note "先做咖啡，再决定怎么加奶。" Preserve this accepted order as the obvious reason for the equipment selection. No completion report yet.

Right heading near the top: "用哪一种，做这杯？" with tiny supporting line "选好器具，就开始动手。" Below it a single row of three apparatus exhibits. Do NOT put them inside three tall bordered rectangular cards. Use lots of white between the three columns, thin baseline rules and subtle square / angled graphic marks. Equipment images are realistically manufacturable, delicately shaded studio-style cutout renders with clean matte shadows and warm natural material, never crude icons.

First exhibit is clearly recommended / highlighted as the focus of this version: a refined upright silver octagonal classic Moka pot, small black handle and lid knob, subtle brushed aluminium and pale reflections, correctly assembled, correctly proportioned, no giant tilted exploded parts. Highest visual weight and slightly larger than the two alternatives, about 300px tall. A small angled vermilion tag "01 / MOKA", a small ochre geometric patch behind it and only a very faint printed numeral 01 for atmosphere. Under the object place readable bold title "摩卡壶"; small explanation "炉火加热 · 压力差送水". One compact primary vermilion button "用摩卡壶制作 →" directly under that explanation. Clicking this is the equipment choice itself, no separate confirmation action.

Second exhibit: smaller warm ceramic conical pour-over filter with paper filter resting on a transparent glass server, elegant plausible apparatus. Small label "02 / FILTRO", title "手冲滤杯 ↗", short explanation "手动注水 · 重力过滤". Its title and exhibit together are a clickable alternative; no large redundant button.

Third exhibit: smaller classic compact petrol-blue and silver espresso machine with a realistic portafilter and a small cup beneath its group head. No oversized fantasy valve assemblies. Small label "03 / ESPRESSO", title "意式咖啡机 ↗", short explanation "水泵加压 · 小份萃取". Its title and exhibit together are a clickable alternative; no large redundant button.

Style: graphic Italian café publication, period advertising typographic confidence combined with understated modern spacing. Fewer inked areas than the reference home. Deep petrol Chinese headlines and espresso secondary text, vermilion for the selected apparatus and single primary action. Ultra-light warm paper grain, crisp slim rules, no rounded boxes, no thick cast shadows, no oily copper, no leather/wood real café diorama. Keep the apparatus rendering compatible with the later silver 3D Moka scene. Everything must plausibly be implemented with HTML text and interactions, CSS positioning and graphic accents, and three render/illustration assets. The beauty comes from proportion, hierarchy, and material rather than an impossible cinematic scene.

Avoid: menus unrelated to accepted order, laboratory data panels, cutaway diagrams, sliders, measurements of extraction, safety warning overlays before any hot operation, extra onboarding links, fake scores, progress steppers, huge background MOKA word, the homepage's landscape and scooters, a giant bottom banner, thick borders around each equipment choice. Ensure Chinese text is accurately rendered and hierarchy is clear.

## 第二张图的参考图

第一张生成的首页概念图，仅用作风格参考。
