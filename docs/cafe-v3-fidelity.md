# 小馆首页：材质、光照和构图统一 · 2026-10-05

本版以用户认可的 `codex-clipboard-2dda262c-75a1-49fc-885b-cddc88d92095.png` 为视觉参考，修正上一版灰色塑料感、器具与台面光源分离、首页杯碟点心与参考不符，以及人物、字级和纸片比例偏差。

## 场景资产

首页由两个独立透明装饰资产及真实 HTML 组成。菜单、换单、自由创作、标题和海报文字仍是可访问的 DOM；人物和陈设不拦截指针。

- `assets/cafe/host-v3.webp`：通过内置 image_gen，从获批概念提取人物，保留暖色插画、姿态、杯子与围裙文字；1585 × 992，原始 PNG 和 alpha 保留。完整提示词见 `cafe-host-v3-prompt.md`。
- `assets/cafe/foreground-v3.webp`：2379 × 840，Blender Cycles / OPTIX 192 样本。摩卡、瓷杯、玻璃豆罐、散豆、叶片、石台与深色前板全部在同一相机和光源下渲染，真实接触阴影与反光保留在该资产中。
- `assets/cafe/v3/`：器具选择页的摩卡、手冲、意式和黑咖/奶咖杯；同一暖光场景、同一摩卡与陶瓷材质，960 × 1200，144 样本。

首页渲染场景为 `work/cafe-foreground-v3.blend`，生成脚本 `work/build_cafe_foreground_v3.py`。摩卡复用已审核用户模型的外壳，烘焙正确的物体尺度，保留制造倒角和法线，替换为带粗糙度/颜色变化和微凹凸的铸铝、低反光黑电木和黄铜。白瓷杯采用新建闭合杯壁、杯缘和杯把，配黑咖啡与薄色液面边缘；首页移除点心。

光源为左上大窗、弱右侧补光与柔和后光；奶油色环境反射、低位竖向反光板和灰色负补光共同形成金属层次。暖色石材通过程序纹理产生细微颜色与凹凸；不是网页滤镜补亮单个模型。色彩管理为 AgX Medium High Contrast / exposure 0.16。

选择页使用 `work/render_cafe_choice_v3.py` 从同一场景生成，原始 `model/` 文件没有改写。Blender 灯光不导出到 GLB，实时教学工作台依然保留可拆分教学模型；本次不把合并外壳当成可准确爆炸的完整内部结构。

## 网页构图

人物位置与尺度、左上字级、菜单尺寸、纸片角度、主背景圆形与斜条依参考调整。吧台前板上的短句仍为 HTML；海报、便签和细纸纹使用 CSS/SVG。装饰层从原来数张独立打光的 cutout 改为一张完整前景，避免杯底、壶底和桌面之间浮空或光源不一致。

桌面保留完整前景的相机投影比例；较矮窗口上移创作便签并缩短菜单行，防止挡住壶钮和页脚。手机以相同资产横向取景，菜单移到人物与器具下方，保留直接来单/自由创作入口。

## 复现

在 `moka-lab` 目录执行以下制作脚本。便携版 Blender 4.5.3 为现有项目工具，不是网页依赖。

```powershell
& 'work/tools/blender-4.5.3-windows-x64/blender.exe' -b --factory-startup --disable-autoexec --python-exit-code 1 --python work/build_cafe_foreground_v3.py
& 'work/tools/blender-4.5.3-windows-x64/blender.exe' -b --factory-startup --disable-autoexec --python-exit-code 1 --python work/render_cafe_choice_v3.py
& 'work/tools/blender-4.5.3-windows-x64/blender.exe' -b --factory-startup --disable-autoexec --python-exit-code 1 --python work/render_cafe_choice_v3.py -- --clean-only
python work/package_cafe_v3.py
```

最终截图与浏览器核验记录位于 `qa/cafe-fidelity-v3-*`。上一版截图和资源保留作比较，不再用于首页陈设。

器具页额外保留同相机的纯本体与接触阴影通道；导出的 shadow catcher 含有间接环境灰底，发布时仅在真实底部附近保留柔和阴影，避免矩形灰片或手柄孔内的灰色填充。

## 实页核验

- 1586 × 990 与 1280 × 720 首页，以及 390 × 844 首页/器具页：图片全部加载，无横向溢出。
- 较矮桌面创作便签末端位于 y=347，留出壶钮空间；菜单末端约 y=644，页脚不会被纸片覆盖。
- 来单「窗边的长杯」进入器具页，加载黑咖目标杯，订单与编号保留；选择摩卡到达 `moka.html?order=window&ticket=3`，模型加载完成且水位控制可用。
- 自由发挥进入同一器具选择页；返回首页正常，装饰层不挡住创作按钮。
- 器具页在实际页面发现的矩形灰底已经修复并重新截图。控制台错误/警告为空，`studio-entrance.js` 语法检查通过。
- 首页人物约 204 KiB，共同陈设约 69 KiB；三个器具与一张目标杯约 327–330 KiB，均为实际发布的透明 WebP。

以上修改集中在入口场景、展示材质与图片管线。冲煮规则、饮品数据与实时结构教学未改写。
