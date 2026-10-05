# 用户模型的页面更新 · 2026-10-05

## 来源和修改

使用项目上层 `model/摩卡壶.blend`、`咖啡杯配零食.blend`、`咖啡机.blend`、`手冲.blend`。原始文件未修改。读取时关闭源文件的自动脚本执行，仅提取器具几何、实例、UV 和适用的材质；背景、布景、文字与旧相机不进入发布素材。

先用保留源材质的低分辨率实渲审核，发现摩卡的锈斑与镜面边缘、咖啡机反射和冷色玻璃杯不适合意式海报页面，再进行以下修改：

- 摩卡：替换为中性细铝面和柔和不锈钢连接件，黑色电木手柄与顶钮、黄铜阀；加微倒角和加权法线，保留轮廓、对齐与壶盖姿态。
- 杯碟点心：杯碟改为奶油色陶瓷，保留点心 UV 与几何；点心仅用于首页陈设，来单目标杯移除点心并分别制作黑咖和奶咖。
- 手冲：保留 Chemex 的玻璃壶与木护套造型，暖木、深皮绳，添加滤纸、粉层和咖啡液。展示标题改为手冲咖啡，避免把一体式手冲壶称作单独滤杯。
- 意式：深咖机身、柔和金属与深色配件；移除顶部六只空玻璃杯，在出液口添加服务杯。原内建磨豆器与水箱保持。

四件器具用同一套中性摄影棚光与反射板。96 样本 Cycles / OPTIX 本体和接触阴影分开渲染，网页阴影降低到原通道的 48%，避免大面积黑色光晕。透明 WebP 不改变器具颜色；首页另做紧凑框取。

## 可编辑源与复现

`work/supplied-moka-studio.blend`、`supplied-cup-snack-studio.blend`、`supplied-espresso-studio.blend`、`supplied-pour-studio.blend`、`supplied-cup-order-studio.blend` 均保存已修改材质和灯光，贴图已打包，清除无用数据。原脚本还保留按原模型尺度转换的矩阵。

为读取 Blender 3.5 和 4.0 资产，使用 [Blender 官方便携版](https://download.blender.org/release/Blender4.5/blender-4.5.3-windows-x64.zip) 4.5.3，存于 `work/tools`，下载后与官方 SHA256 核对。它是制作工具，不是网页运行依赖。

在 `moka-lab` 目录按顺序运行：

```powershell
& 'work/tools/blender-4.5.3-windows-x64/blender.exe' -b --factory-startup --disable-autoexec --python-exit-code 1 --python work/render_supplied_cafe.py
& 'work/tools/blender-4.5.3-windows-x64/blender.exe' -b --factory-startup --disable-autoexec --python-exit-code 1 --python work/render_supplied_cup_variants.py
& 'work/tools/blender-4.5.3-windows-x64/blender.exe' -b --factory-startup --disable-autoexec --python-exit-code 1 --python work/render_clean_cutouts.py
python work/package_supplied_renders.py
```

最后一条需要 Pillow。`assets/cafe/supplied/render-manifest.json` 记录原模型、镜头与归一尺寸，`web-manifest.json` 记录发布素材与真实图片尺寸。

## 当前接入范围

首页与器具选择页使用 Blender 渲染素材，按钮、订单和文字保持 HTML；摩卡实时工作台继续使用含教学内腔的可拆分模型。新摩卡外观是合并网格，不能直接替换现有零件后仍声称内部爆炸结构准确。手冲与意式工作台也未在本次改成这批展示模型。

## 实际审核

- 1280 × 720 桌面首页：两件新陈设完整加载，壶盖不被创作便签遮住，杯碟缩小后留出手部与器具之间的空间。
- 同尺寸器具页：三件新器具及黑咖、奶咖目标杯加载；无横向溢出或控制台错误。
- 390 × 844 窄屏：首页新壶、杯碟在菜单上方，末端不触及菜单；器具页四张图片加载，三个选项均存在，无横向溢出。
- 来单与自由入口都进入器具页；黑咖来单加载黑咖杯，选择摩卡保留订单与编号并到达实时工作台。
- 四个既有 Node 测试文件通过：配方和订单、准备依赖、用量与热状态控制、状态守恒。

最终实页截图：`qa/supplied-model-home-live.png`、`qa/supplied-model-choose-live.png`、`qa/supplied-model-home-mobile.png`、`qa/supplied-model-choose-mobile.png`。

## 概念图场景补齐

用户指出首页漏了右上咖啡海报和底部桌面。现新增带纸边、旋转和轻阴影的意式海报；原单色底块改为浅色台面与深色前板，包含斜向前沿、亮边和细纹。菜单、创作便签加入细纸纹，菜单底部补英文题记。页脚短句沿吧台前板排版。

豆罐、咖啡豆和绿叶是独立 Blender 资产：`work/cafe-counter-props.blend`，由 `work/build_counter_props.py` 创建。玻璃罐配暖金属盖与弧面纸标签；咖啡豆使用两瓣曲面与中间凹槽，绿叶有折面、厚度和柔和材质。Cycles / OPTIX 64 样本渲染，导出 `assets/cafe/counter-jar.webp` 和 `counter-beans.webp`，共约 44 KiB。模型本体不加入点击入口。

海报和吧台使用代码绘制，文字保持独立 HTML，桌面轮廓以 SVG 适应宽高；没有把整页当作背景图。装饰均隐藏于辅助技术并关闭指针命中。便签上移留出壶钮，杯、壶、罐的底部落在浅色台面内。

在 1280 × 720、1586 × 990 和 390 × 844 实页中核验，全部图片加载，无横向溢出。窄屏调整吧台上沿与人物、杯壶衔接，豆罐和散豆隐藏以保留菜单空间。通过实际点击验证自由发挥可进入选器具页并返回。

当前截图：`qa/cafe-complete-scene-desktop.png`、`qa/cafe-complete-scene-wide.png`、`qa/cafe-complete-scene-mobile.png`。
