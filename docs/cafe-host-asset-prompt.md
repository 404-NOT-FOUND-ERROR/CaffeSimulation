# 咖啡小馆人物素材 · 2026-10-04

用途：从已认可的首页概念提取人物，作为真正 HTML 界面中的独立透明剪贴画。

参考：`assets/concepts/studio-homepage-collage-01.png`。
成品：`assets/cafe/host-cutout.png`（1536 × 1024，RGBA）。
工具：内置 image_gen，`transparent_background: true`。人物以装饰图片使用，菜单、标题和入口均为独立 HTML 控件。

## 完整生成提示词

Use case: background-extraction, identity-preserve.
Input image: the approved interactive café collage homepage. Extract ONLY its central illustrated café hostess as a standalone high-resolution transparent PNG asset for the actual webpage.

Keep the exact same adult woman's face, sculptural wavy dark bob hairstyle, gold hoop earrings, cream rolled-sleeve blouse, copper-brown apron, tasteful illustrated shading and inviting pose. She holds out a small plain white coffee cup on a saucer with her raised hand, while her other arm extends down and right with her hand resting naturally on an invisible counter. Preserve the narrow cream paper-cut border around her silhouette. Keep the entire visible head, cup, saucer, both hands and arms, and waist/apron down to the same clean cropped bottom edge as the reference. Put the complete figure centrally with a small transparent margin, no cut-off fingers, hair, cup or arm on any outside edge.

Remove EVERY other element: all background color, copper graphic shapes, CAFFÈ lettering, menu papers, titles, free-creation note, tape, clip, counter, standalone Moka pot, and separate coffee cup. The hostess-held cup remains. No text or branding on clothes, cups or apron. No opaque rectangle. Background must be genuinely fully transparent with alpha, not a white background or checkerboard illustration. Do not redesign the woman or change her identity, facial expression or gesture. No extra host animation frames, no other characters. The only opaque pixels are the illustrated woman's cutout, the cup she holds and the thin cream cutout edge. Use a portrait-to-square canvas proportion with all the outstretched arm comfortably included.
