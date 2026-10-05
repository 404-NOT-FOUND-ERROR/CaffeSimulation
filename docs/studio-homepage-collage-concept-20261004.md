# 咖啡小馆首页：人物剪贴画概念

使用内置 image_gen 生成，再进行一次减少装饰、增加留白的图像编辑。最终图仅供页面设计审核。

最终图片：assets/concepts/studio-homepage-collage-01.png

## 本次设计方向

用户认可器具选择页的精致感，但首页需要游戏化的咖啡实验室/咖啡小馆场景，不能继续复用操作页的排版。人物剪贴画与贴在场景中的菜单、入口组合成一张可点击的意式海报。

保留奶油白、铜橙、深咖色、现代中文无衬线与斜向拉丁字的视觉传承。人物采用独立插画剪贴层，摩卡壶与杯子采用细腻渲染剪贴层。图形背景为简洁圆形与斜面。

## 交互与实现约束

- 今日菜单中的每张来单可以直接点击，接单后进入器具选择。
- 换一批只替换来单，不让人物和整体场景跳动。
- 自由发挥纸片直接进入无订单的器具选择。
- 不增加必须点人物对话、打开菜单、新手模式等中间操作。
- 人物为透明素材，轻微呼吸或层间视差可以用 CSS 实现；不承诺单张人物图片能完成眨眼、手部换姿等复杂动画。
- 菜单文字、订单行、换一批、自由发挥均为独立 HTML 控件，视觉贴纸不烘焙交互文字。
- 纸片可以用 CSS 实现角度、短阴影和悬停轻抬；点击范围跟随实际变换后的控件。
- 画面不依赖完整实时 3D 咖啡馆。器具可用渲染图或后续已有模型的固定视角。
- 手机端需要重新安排图层和纸片顺序，保持菜单、自由发挥可以读清和点击。
- 当前是概念图，不是网站运行截图。

## 初始生成完整提示词

Use case: ui-mockup.
Asset type: ONE new high-fidelity desktop homepage concept for a playable Chinese coffee studio / small café HTML experience. A flat front-on 1600 x 1000 landscape webpage, no browser frame, no device mockup, no multiple-screen collage.

Input image 1: user's approved equipment-page image, STYLE REFERENCE ONLY. Carry forward its cream #f4ecdd, copper orange #b65c38, espresso brown #302016, clean assertive contemporary Chinese sans-serif, refined silver apparatus, fine rules, oblique Italian condensed Latin type, and precise materials. DO NOT reuse its column layout or equipment catalog composition.

Primary request: the user wants a game-like, inviting coffee-studio home using an elegant CHARACTER CUTOUT COLLAGE and clickable menus/entry notes attached around the character. The main concept is a coffee laboratory or small café. This is an interactive Italian poster scene, with random incoming orders called "今日菜单" and a separate "自由发挥" entry. It is a playful, art-directed foyer that can be explored by clicking its paper pieces. It must be genuinely composed differently from the later preparation pages, while preserving the approved visual quality.

Art direction: refined Italian Art Deco / modernist advertising transformed into a contemporary paper-cut interface. A designed collage of a stylish illustrated café host, elegant typographic fragments, clean geometric copper planes and precise photoreal cutout coffee objects. The artwork must feel confidently Italian in poster composition and proportions, NOT a Chinese 1980s old advertisement, NOT an oil painting, and NOT a rustic café photograph. No distressed paper, no sepia, no heavy mottled grain, no stains, no brush lettering, no Song/Ming serif Chinese. Cream stays clean and luminous with only very subtle surface texture. No cartoon mobile game dashboard, no neon outlines, no childish outlined mascots or thick sticker borders.

Composition: make ONE unified interactive poster scene with approximately 30 percent breathing space. A restrained cut-paper café counter sweeps diagonally across the lower quarter as a simple cream and espresso geometric plane; only a suggestion of a café, not a real furnished 3D room. A large copper circular/diagonal graphic shape occupies the middle background, with strong condensed italic ivory "CAFFÈ" partially interleaved behind the host. No rays, flowers, flags, scooters, landmarks or city scenery. The title is integrated into a slightly angled typographic fragment in the upper-left, not in a normal hero column: modern dark-espresso Chinese "咖啡小馆", about 60-70px, and small elegant letterspaced "OFFICINA DEL CAFFÈ". Under it only a small clear line "今天，这一杯由你来做。". Absolutely no top navigation bar.

Character: a single stylish friendly adult café host as a large beautifully designed printed-illustration cutout in the center, about 520px tall, waist-up behind the abstract counter. Prefer a woman with dark sculptural bobbed hair, warm cream shirt with rolled sleeves, copper apron, expressive but understated graceful pose offering a white espresso cup on a saucer in one hand. The other hand rests naturally on the counter or gestures toward the order papers. She is an elegant graphic figure made from flat warm-cream, copper and espresso shapes with restrained facial lines and a little clean print shading. Natural believable hands, no exaggerated caricature or huge head. A narrow 3px cream cut-paper edge and small crisp offset shadow visually lift the figure from the background. The character must be the scene's emotional anchor, not a tiny icon beside text, not a photographic human pasted into a product catalog. Avoid old-fashioned chef hats, stereotypical moustaches, oily realism and elaborate period costume.

Interactive area A, today's menu: to the left of the central host, a loosely attached ivory menu sheet slightly rotated 3 degrees counterclockwise, held by one restrained thin metal paperclip or a small neat cream tape strip. It has graphic espresso/copper heading "今日菜单" and a small, genuinely visible "换一批 ↻". Its width is about 350-390px. Inside the sheet, three fully readable compact order slips with lots of spacing, fine separators and modern sans-serif typography:
"01  早餐搭档" / "热奶咖 · 牛奶多一些" / a small direct arrow.
"02  厨房来客" / "摩卡壶 · 原液黑咖" / a small direct arrow.
"03  清爽冰咖" / "冰黑咖 · 不加奶" / a small direct arrow.
Each slip is directly clickable to accept that order and proceed to equipment choice, no intermediate "open menu" button. Make one slip subtly lifted from the sheet with a very short graphic shadow and copper edge, communicating hover/click affordance. Do not show a mouse cursor. These are incoming requests, not priced e-commerce products. No prices, shopping cart or ratings.

Interactive area B, free creation: a separate clean square/cut-corner paper note attached on the right side of the composition, slightly rotated clockwise 2 degrees, around 280-320px wide, at a different height from the menu. It has heading "自由发挥", a compact supporting sentence "不用接单，做自己的配方。" and clear action "开始创作 ↗". Treat the entire note as one direct clickable entry. Use a small espresso graphic arrow and copper edge/ink rather than a generic rounded button. This note may sit partly over a small refined cutout of a silver octagonal Moka pot or beside a coffee cup on the counter; ensure the note does not cover the character or any menu text.

A few supporting cutout objects on the counter, very restrained: one accurately proportioned upright silver Moka pot with black handle, matching the refined metal quality in the reference, and one small ivory coffee cup. They occupy perhaps 10 percent of the screen combined, not another three-equipment lineup. The character illustration and product objects should intentionally mix print and real materials like an art-directed collage. Keep contact shadows short, precise and very light, no heavy depth or wooden furniture.

A small single pinned graphic coffee-poster fragment may peek from behind the free-creation note to hint at the eventual shareable special issue; it is decorative, not a third large entry or mandatory step. No giant bottom content strip, no footer gallery. Maintain broad empty cream areas around all interactive pieces. Keep the eye path playful and asymmetric rather than a rigid left-text / right-product page or a three-column grid. Menu and free note are placed at DIFFERENT heights and angles, linked by the character gesture and diagonal graphic field. Collage layering must not compromise readable text or clean click areas.

Technical realism: all exact Chinese text, order rows, refresh and entry controls should appear as independently buildable HTML overlays; the character and coffee objects can be transparent PNG assets; rotation, tape, paper layering, diagonal geometry and short shadows are feasible CSS. Give only subtle implied parallax and hover-lift, no cinematic impossible room animation. The user can immediately select one random order or choose free creation, followed by equipment choice. No independent tutorial mode, no first-cup entrance, no required character dialogue, no XP or energy meters, no game currency, no extraction controls or stats. Accurately legible clean modern Chinese, high-end Italian poster confidence, approachable game-like café scene, precise visual inheritance from the reference.

## 最终留白优化完整提示词

Use case: ui-mockup, precise composition refinement.
Edit the supplied coffee-café homepage concept. Preserve its overall Italian poster direction, warm cream / copper / espresso palette, central illustrated café-host cutout, the same woman's identity and inviting cup gesture, large diagonal CAFFÈ, left "今日菜单" with three incoming orders, and right "自由发挥" paper entry. Preserve the clean modern sans-serif Chinese. This is a single refinement to make the scene much more airy and controlled.

Make the entire collage breathe: reduce the host, title fragment, menu sheet and free-creation note by roughly 12-15 percent relative to the canvas, while retaining their left / center / right relationship and staggered paper angles. Widen the blank cream margins and gaps between independent layers. The host should still be the anchor, with menu and free-creation papers comfortably readable; do not turn the image into a conventional web grid. Empty cream space should be about 25-30 percent of the full screen. Keep the copper circle and diagonal as restrained graphic background, with cropped oblique ivory CAFFÈ.

Remove visual clutter: remove all loose coffee beans, the bean jar, the plant, tiny decorative slogans on the background, the random English script below the menu, the date, the small lower-edge slogans, and lettering on the cups/apron. Keep only the necessary brand/name and actual interaction copy. Do not add new objects.
Replace the bulky brown photoreal cafe counter/furniture at the bottom with a light simple abstract cream cut-paper ledge, a short soft shadow and one slender espresso diagonal edge. It should be an elegant poster plane with generous blank space below, not a fully built realistic café counter. Keep one small accurate silver Moka pot and one small plain ivory coffee cup at the lower right with short clean contact shadows; they are supporting cutouts, not main objects.
Make paper surfaces smooth clean ivory with almost no mottled grain or aged texture. Thin cut-paper outlines, minimal paperclip/tape, very short subtle shadows. Retain sophisticated illustrated shading on the host but simplify the clothing texture slightly. Avoid oily realism or a childish game style. Remove any heavy full-width footer.

Keep these exact primary text elements legible and correctly spelled:
"OFFICINA DEL CAFFÈ"
"咖啡小馆"
"今天，这一杯由你来做。"
"今日菜单"
"换一批 ↻"
"01  早餐搭档"
"热奶咖 · 牛奶多一些"
"02  厨房来客"
"摩卡壶 · 原液黑咖"
"03  清爽冰咖"
"冰黑咖 · 不加奶"
"自由发挥"
"不用接单，做自己的配方。"
"开始创作 ↗"
Each order has a small arrow and the first slip has a very restrained hover-lift copper edge. Each entire order and the free-creation note is one real click target in the eventual HTML. No extra entrance or dialog.

Output one refined flat front-on desktop UI concept at the same landscape composition, no browser chrome, no mockup frame, no additional panels. The user should feel invited into a playable paper-collage café while recognizing the refined cream/copper/espresso visual family of the later operation pages.

## 参考图

用户提供的获认可器具选择页：codex-clipboard-28c67c27-5876-4e8b-b911-15a62f862393.png。
最终编辑参考本次生成的第一张剪贴画首页草案，保留人物与主交互关系，删去多余装饰。
