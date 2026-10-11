# CaffeSimulation · 完整单文件版

本分支用于分发可以独立保存的一份 HTML，源码与素材制作文件在 [main 分支](https://github.com/404-NOT-FOUND-ERROR/CaffeSimulation/tree/main)。

**下载 [index.html](https://github.com/404-NOT-FOUND-ERROR/CaffeSimulation/raw/refs/heads/single-html/index.html)，保存后用桌面 Chrome 或 Edge 打开。** 也可放到普通静态网页服务器上。

文件约 40 MiB，内嵌所有运行图片、六组件 GLB 模型、Three.js、页面脚本和样式，不需要旁边有 assets 目录，不使用 CDN。首次解析需要一些时间，三维结构需要 WebGL。

完整体验包括：

1. 咖啡小馆：随机来单或自由创作，选择摩卡壶。
2. 准备水与粉：二维剖面调整，同步观察三维部件。
3. 冲煮：调节火力、观察出液，同时查看六组件爆炸视图。
4. DIY：添加牛奶、水、奶泡、糖浆或逐块加冰，搅拌、撤销和改名。
5. 双杯实验：同一锅分杯，分别修改配方，库存守恒。
6. 出品特刊：构图与配色选择，实际配方对应成品，下载 1200 × 1800 PNG。

PNG 在浏览器中生成，单文件版不需要本地 Node 服务或后台导出接口。配方、制作进度与特刊册使用当前浏览器的本地存储；移动文件、换浏览器或换地址不会自动转移记录。

![实际单文件版特刊页](https://raw.githubusercontent.com/404-NOT-FOUND-ERROR/CaffeSimulation/main/qa/single-html-review-2026-10-11/03-gazette.png)

## 核验与重建

发布日期：2026-10-11。12 组状态与模型测试通过；内嵌资源与文件 SHA-256 校验通过。实际浏览器完成接单、冲煮、调配、逐块加冰、搅拌、分杯、特刊 PNG 下载、返回调配和查看来源。预览服务器只提供一份 HTML，所有旁路资源返回 404。

自动化浏览器不允许 file://，因此本机双击文件的方式未自动核验。若浏览器禁止本地文件存储，请把同一份 HTML 放到普通静态服务器使用，无需关闭安全设置。更多核验截图和说明见 [单文件记录](https://github.com/404-NOT-FOUND-ERROR/CaffeSimulation/blob/main/docs/single-html.md)。

重新打包请切到 main，执行 `npm install`、`npm run build:single`，输出为 `dist/caffe-simulation.html`。`single-html-manifest.json` 记录各资源与完整 HTML 的 SHA-256。

代码采用 [MIT 许可](LICENSE)，Three.js MIT 许可已保留在 HTML 内；其他素材来源与边界见 main 的 [ASSET_PROVENANCE.md](https://github.com/404-NOT-FOUND-ERROR/CaffeSimulation/blob/main/ASSET_PROVENANCE.md)。成品颜色与液体动画为教学示意，不是物理流体或风味预测。
