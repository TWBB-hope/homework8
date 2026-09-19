# 课堂作业八 · 前端技术整合、质量检查与成果验收

课程：软件开发综合实践（2026 年秋季学期）　｜　第八次课（收官课，8 学时）　｜　姓名：李偲钿　学号：20251060150　班级：4 班
主题：校园公共信息与数据展示中心（案例复现）＋ 校园运动场馆信息与预约看板（自主实践，期末大作业原型）

## 一、这个仓库里有什么

| 目录／文件 | 说明 | 对应作业要求 |
| --- | --- | --- |
| `integration/` | **案例复现：迷你版校园信息中心**。首页（Bootstrap 导航与卡片）、自习室查询（按楼层／开放状态／关键字筛选）、使用统计（ECharts 柱状图＋折线图，读 `data/data.json`）、校园三维区（`three-d/scene.html`，Three.js 地标场景） | 必须完成任务·案例复现（指南第六部分三步） |
| `practice/` | **自主实践：校园运动场馆信息与预约看板**（期末大作业原型）。概览卡片、场馆查询与预约（jQuery 筛选＋localStorage 增删预约）、使用分析（Chart.js 折线图＋环形图）、场馆三维（Three.js，读同一份 `data/facilities.json`，表格"在三维区查看"可直接定位到某场馆） | 必须完成任务 1～3、6（指南第七部分） |
| `docs/quality-check.md` | 五项质量自查记录（功能与边界、三档宽度、错误三状态、可访问性、仓库与 README），含截图待补位置 | 必须完成任务 3 |
| `docs/peer-review.md` | 同伴审查记录（意见＋逐条处理：采纳／拒绝／修改）与轮值协调四要素记录表 | 必须完成任务 4、5 |
| `docs/final-plan.md` | 期末大作业实施计划初稿：任务分解、时间表、风险清单三张表 | 必须完成任务 8 |
| `docs/课堂实践进度报告八.docx` | 课堂实践进度报告八（Word，按模板十节填写） | 提交物·进度报告 |
| `docs/submission-checklist.md` | 雨课堂提交清单（在哪里交、交什么、还差什么） | 提交要求 |
| `research/` | 三项独立研究任务的实验页：Lighthouse 报告存档、`script-loading.html`（defer／async 对照实验）、W3C 校验记录，结论汇总在 `docs/research.md` | 独立研究任务（选做）1～3 |
| `screenshots/` | 质量自查截图集（按 `screenshots/README.md` 的命名补充） | 提交物·截图集 |
| `vendor/` | 第三方库的固定版本本地副本，CDN 不可达时自动兜底 | 断网可用 |
| `homework-8.docx` / `student-guide-8.docx` | 教师下发的作业要求与实践指南原件 | — |

## 二、怎么跑起来

**方式 A（推荐，能读到本地 JSON）**

```bash
cd homework8
python -m http.server 8000
```

然后浏览器打开：

- 案例复现：<http://127.0.0.1:8000/integration/index.html>
- 自主实践：<http://127.0.0.1:8000/practice/index.html>

**方式 B（直接双击）**：双击 `integration/index.html` 或 `practice/index.html` 也能打开。浏览器禁止 `file://` 页面读取本地 JSON，此时页面会显示黄色提示"数据读取失败，已切换内置备份数据"，功能全部照常可用（备份数据与 JSON 内容一致），**不是白屏也不是报错卡死**。

**离线情况**：库优先走 CDN，CDN 不可达时自动改读仓库内 `vendor/` 的同版本副本；若把 `vendor/` 一起删掉，页面会显示"图表库未能加载／三维库未能加载"的红色提示，文字列表与导航仍可正常使用。

浏览器：Chrome 与 Edge 均已验证。无需构建、无需安装依赖、无后端。

## 三、目录结构

```
homework8/
├── integration/              案例复现：迷你版校园信息中心
│   ├── index.html            统一入口（首页/自习室/使用统计/校园三维）
│   ├── css/style.css         自定义样式（在 Bootstrap 之后引入）
│   ├── js/app.js             原生 JS：数据加载、筛选、ECharts 渲染、错误三状态
│   ├── data/data.json        自习室与月度使用数据
│   └── three-d/scene.html    Three.js 校园地标（同目录 scene.js）
├── practice/                 自主实践：运动场馆看板（期末原型）
│   ├── index.html            统一入口（概览/场馆查询与预约/使用分析/场馆三维）
│   ├── css/style.css         自定义样式
│   ├── js/app.js             jQuery：筛选、预约增删（localStorage）、Chart.js
│   ├── data/facilities.json  场馆与一周预约数据
│   └── three-d/scene.html    Three.js 场馆三维（读同一份 facilities.json）
├── vendor/                   固定版本的第三方库（CDN 兜底）
├── docs/                     质量自查、审查与协调记录、实施计划、进度报告
└── screenshots/              质量自查截图集
```

## 四、各技术的职责边界（按指南第三部分）

| 技术 | 本项目只用它做 | 没有用它做 |
| --- | --- | --- |
| 原生 JS | `integration/js/app.js` 的核心逻辑与数据处理 | — |
| jQuery 3.7.1 | `practice/js/app.js` 的 DOM 查询、事件委托与表单交互 | 不与原生 JS 混写同一处逻辑 |
| Bootstrap 5.3.3 | 栅格、导航、卡片、徽章等布局与基础组件 | 不整体覆盖，只在 `css/style.css` 里补自定义 |
| ECharts 5.5.0 | 案例复现的柱状图与折线图 | 不与 Chart.js 画同一张图 |
| Chart.js 4.4.1 | 自主实践的折线图与环形图 | 同上 |
| Three.js 0.128.0 | 两个三维子页面 | 不塞进主页面拖慢首屏 |

加载顺序统一为：**第三方库在前，自己的代码在后**；CSS 为 **Bootstrap 在前，自定义在后**（保证能覆盖）。所有 CDN 均写死版本号，不使用 `latest`。

## 五、数据与资源来源

| 资源 | 来源 | 许可 |
| --- | --- | --- |
| Bootstrap 5.3.3（CSS/JS） | jsDelivr CDN：`bootstrap@5.3.3` | MIT |
| jQuery 3.7.1 | jsDelivr CDN：`jquery@3.7.1` | MIT |
| ECharts 5.5.0 | jsDelivr CDN：`echarts@5.5.0` | Apache-2.0 |
| Chart.js 4.4.1 | jsDelivr CDN：`chart.js@4.4.1` | MIT |
| Three.js 0.128.0 | jsDelivr CDN：`three@0.128.0` | MIT |
| 自习室／场馆／预约量等全部数据 | 自编虚构数据，仅用于课堂练习，不对应真实场馆与真实价格 | 自编 |
| 图标与图片素材 | 未使用任何位图素材；三维场景全部由 Three.js 代码生成的几何体构成 | — |

## 六、Git 提交与检查

```bash
git log --oneline          # 分步提交：骨架 → 交互与图表 → 三维与自查 → 自主实践 → 文档与报告
git remote -v              # origin = git@github.com:TWBB-hope/homework8.git
```

远程仓库：<https://github.com/TWBB-hope/homework8>

## 七、工具使用声明

按实践指南第九部分第 10 条要求填写：本仓库代码与文档编写过程中使用的辅助工具及用途，见 `docs/课堂实践进度报告八.docx` 第 10 节。所有代码均已逐段核对并能现场解释与修改。
