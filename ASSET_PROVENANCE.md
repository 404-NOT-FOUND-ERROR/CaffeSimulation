# 素材与源文件

## 2026-10-11 · 细节升级与单文件发布

- `assets/gazette-v2/coast.png` 和 `person.png` 是内置 imagegen 生成的独立海岸建筑、植物与人物海报底图。完整提示词与生成源路径见 `assets/gazette-v2/provenance.json`。成品杯、液色、标题、克数和配方仍由实时状态单独绘制。
- 三维倾角、金属反射、部件选中反馈、倒料容器、银色勺子和每块 15 g 的落冰动画在运行代码中实现。实际页面截图及检查记录见 `qa/polish-review-2026-10-11/`。
- `scripts/build-single-html.mjs` 将现有三个页面的运行脚本、样式和 43 个资源内嵌到一份 HTML；保留 Three.js MIT 许可。`dist/` 是本地生成目录；发布分支根目录的 `index.html` 为该构建产物，资源 SHA-256 清单随单文件版发布。
- 当前发布前完整运行 12 组状态与模型测试，并单独校验内嵌资源、三个脚本包的语法与文件 SHA-256。单文件浏览器核验截图另存于 `qa/single-html-review-2026-10-11/`。下方记录中的“没有提交或推送”描述各历史轮次结束时的状态。

## 2026-10-09 · 实时三维与二维并行工作台

- `assets/hybrid/moka-v1.glb` 由项目原创 `work/poster-workbench-v1.blend` 改造，不来自 MakerWorld 或用户第三方模型库。脚本 `work/build_hybrid_moka.py` 重建滤网通孔、上壶连接座及六组件分组；可编辑成果为 `work/hybrid-moka-v1.blend`。
- `assets/hybrid/geometry.json` 记录共同轴、半径、高度、金属间隙与全展开间距。`moka-diagram.mjs` 使用同一比例绘制原生 SVG 操作剖面。模型是教学原创几何，没有实物型号尺寸或制造认证。
- `hybrid-moka-viewer.mjs` 的铝、抛光铝、胶木、橡胶和黄铜材质，以及环境反射与微表面均为代码生成；没有将生图概念贴到模型上。
- `assets/hybrid/italian-atlas.svg` 是项目原生几何海报插画，没有复制品牌海报。特刊人物拼贴复用既有生成插画 `assets/cafe/host-v3.webp`，保留原素材来源约束。
- `qa/hybrid-review-2026-10-09/` 为实际网页截图与实际特刊输出。设计参考仍在 `assets/concepts/coffee-hybrid-flow-2026-10-09/` 和 `coffee-brew-science-merged-2026-10-09/`，没有用整页概念图冒充运行界面。
- 当前默认 `moka-brew.html` 采用新混合工作台；原固定相机渲染、旧场景和脚本仍保留供比较。


## 2026-10-07 · 二维配方实验室（当前默认页面）

- `assets/recipe-lab/moka-stove.png`、`moka-parts.png` 与 `corner-still-life.png` 使用内置 imagegen 生成，完整提示词和生成文件来源见 `assets/recipe-lab/prompts.json`。10 月 8 日起，壶/炉头和六组件改用下方记录的 `assets/poster-workbench/` 原创 Blender 素材；植物仍使用生成插画。早期生成 PNG 保留，没有把概念页面直接用作交互底图。
- 下壶水位、安全阀下缘线、粉层、中心导管、水路、出液、玻璃杯、成分色带、冰块和热点由项目原生 SVG 绘制，参数由 `recipe-state.mjs` 驱动。插画不提供实物尺寸、内部几何或加热器设计的工程依据。
- 特刊通过 Canvas 绘制，杯子图与实际配方共用同一状态。搅拌的色带卷动、混色、冰块和勺子由 `recipe-mix-art.mjs` 原生 SVG 绘制；六个渲染组件的裁切与热点由 `recipe-moka-art.mjs` 处理。配方图为成分示意，成品色为风格化表达，不是物理分层或味觉预测。
- `qa/recipe-lab/*.jpg` 是本地可运行页面的浏览器截图，`08-export.png` 是实际生成的 1200 × 1800 特刊；六页概念参考仍单独保存在 `assets/concepts/coffee-2d-flow-2026-10-07/`。
- 10 月 8 日主流程重新接入原海报摩卡工作台：`moka-brew.html` 共享 `workshop-experience.js`、原 Blender 透明组件与原生 SVG 剖面。关火收杯后，`recipe-workshop-bridge.mjs` 传递实际咖啡液和批次记录到二维配方桌；没有新增模拟三维碰撞或生图模型。
- 原固定相机 Blender 操作台保存在 `moka-legacy.html`，已有素材和源场景保留。

- `vendor/` 中 Three.js 及其配套加载器保留 MIT 许可，见 `vendor/THREE-LICENSE.txt`。
- `assets/cafe/` 的展示素材由项目 Blender 场景渲染或内置图像生成工具生成。场景和制作脚本位于 `work/`；生成提示词与审核记录位于 `docs/`。
- 摩卡、杯碟、手冲和咖啡机的输入模型由用户提供。仓库保存处理后的展示资产和可编辑工作场景，没有打包父目录的原始模型库。模型及其衍生素材仍需遵守原始素材的许可，本仓库的软件许可不替代这些权利。
- `assets/concepts/` 为设计参考图，包含生成图。不能用图内示意结构或文字充当经核实的科学图解；操作界面的科学图解由原生 SVG 与状态系统驱动。
- 浏览器中的成杯记录保存在本机。`exports/` 是本地 PNG 导出目录，不进入版本控制；Blender 程序、缓存和运行日志也不进入版本控制。

## 2026-10-07 · 摩卡海报操作台

- `assets/poster-workbench/` 的摩卡壶、炉头、杯碟和液面由项目自行建模及渲染，不使用用户模型库或下载的第三方灶模型。重建脚本为 `work/render_poster_workbench.py`，可编辑场景为 `work/poster-workbench-v1.blend`。
- 原创参数几何包含下壶、粉篮、密封圈、滤网、上壶、壶盖六个组件。螺纹、孔洞、内腔与安全阀是教学表达，没有实物尺寸校准，不能用于制作可加热的实物壶。
- Cycles 产品渲染共享固定相机和光照，投影锚点及杯量档位写入 `manifest.json`。网页使用 15 张透明 WebP，合计 195,084 字节；PNG 保留作为渲染源图。压缩脚本为 `work/optimize_poster_assets.py`。
- 场景运动通过独立组件和 CSS 实现，水位、水路、火力、配方、容量及安全提示由 HTML/SVG 和状态系统实时驱动。没有把整张概念图当作可点击页面；亦不宣称实时三维流体或实物压力计算。
- `qa/poster-workbench-*.jpg` 为本地运行页面的实际截图，`assets/concepts/moka-ui-candidates-2026-10-07/` 仍仅为生成的设计参考。

## 2026-10-11 · 获批六页参考落地

- 本轮视觉来源为用户批准的首页、准备、合并冲煮、单杯、双杯和特刊六张参考。完整参考路径和 12 个内置 imagegen 输出的源文件路径见 `assets/reference-room/prompts.json`；逐字提示词未留档，该文件明确记录 `prompt_summary`，不冒充原始提示词。
- `assets/reference-room/` 中的房间背景生成要求移除全部 UI，保留获批墙面、桌面、人物拼贴、海报、室内光照与 16:9 构图。下壶、冲煮外壳、粉篮、原料物件条和完整摩卡壶从获批参考提取为独立透明物件图，作为装饰或外壳使用。
- `glass-frame.png` 的生成结果存在不透明杯内区域。运行页面只裁取杯缘与杯底，杯内液体不使用该位图；水、咖啡、粉粒、火焰、混合、冰块与勺子由原生 DOM/SVG 和实时状态绘制，按钮、输入和数值同样保留为真实网页控件。
- 右侧六组件实时视图继续使用 `work/build_hybrid_moka.py` 制作的原创 Blender GLB 与 Three.js，没有以生成图替代三维结构。上壶展开偏移 2.5、壶盖 3.1 用于保持 70% 展开时滤网可见；共同几何记录中的金属径向间隙为 0.007 个示意模型单位。
- 本目录另保留 `work/render_reference_objects.py` 从原创 Blender 场景渲染的早期物件图及 `objects.json` 投影记录，来源与 imagegen 输出在 `prompts.json` 中分列。
- `npm test` 的 11 个脚本通过；实际浏览器完成 120 g 水 / 18 g 粉 → 86.4 g 咖啡液 → 单杯调配 → 双杯分别编辑 → 三种特刊构图 / 三种配色 / 1200 × 1800 PNG 导出。实际运行截图见 `qa/reference-review-2026-10-11/`，`07-export.png` 为真实导出。已确认 844 × 390 双杯和特刊页；其余页面的小屏检查不在本记录已确认范围内。
- 实现与核验详情见 `docs/reference-fidelity-2026-10-11.md`。实时金属材质和光照仍比参考简化，液体为状态驱动示意，不宣称完整照片级复现、流体仿真或制造精度。本轮没有创建 Git 提交或推送。
