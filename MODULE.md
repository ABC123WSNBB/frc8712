# PlanGraphModule

通用嵌入模块：宿主负责计划数据和详情界面，模块负责三维计划图谱、深空粒子背景、节点选择、旋转缩放和摄像头手势。

```js
import { mountPlanGraph } from './module-dist/plan-graph-module.js';
const graph = mountPlanGraph(document.querySelector('#slot'), {
  plans,
  onSelect: plan => host.openPlan(plan.id),
  onGesture: state => host.updateGestureHint(state.mode),
  onStatus: status => host.showStatus(status),
  modelAssetPath: '/assets/hand_landmarker.task',
  wasmPath: '/assets/mediapipe/wasm'
});
graph.setPlans(nextPlans);
await graph.startCamera();
// 卸载页面时：graph.destroy();
```

接口：`setPlans(plans)`、`getPlans()`、`select(id)`、`resetView()`、`zoom(amount)`、`rotate(x, y)`、`startCamera()`、`stopCamera()`、`destroy()`。

手势：食指连续停留 420ms 打开一次；指向后捏合锁定，松开稳定 80ms 打开。捏合中转腕超过 0.06 弧度后只旋转，松开不打开；无目标时捏合不复位。目标触发后需离开至少 200ms 才能再次触发。追踪恢复等待 200ms；缩放进入等待分别为放大 120ms、缩小 180ms。两个页面共用按时间平滑及状态机。

模块通过回调及冒泡 DOM 事件派发 `onSelect`、`onGesture`、`onStatus`、`onDestroy`。计划对象至少需要 `id`、`title`、`type`（`day`/`month`）、`date`；`status` 默认 pending，`parentId` 默认 null。同月的日计划可以关联月计划。数据更新先校验再应用，内部持有副本，不改变宿主对象。模块不读取或写入 localStorage。

深空粒子星球、星云、螺旋星系和彗星均为非交互背景，不参与鼠标、触控或手势命中。为兼容旧宿主，`onCosmicSelect`、`getCosmicObjects()` 与 `interactCosmic(id)` 仍保留：该回调不会触发，前者方法返回空数组，后者为无副作用的链式调用。

容器必须有明确高度，例如 `height:600px`。样式在 Shadow DOM 内隔离，不需要额外 CSS。快捷键只在模块获得焦点时处理。启动摄像头由宿主按钮调用，页面隐藏时自动关闭；删除视图前调用 `destroy()`，可重复调用。其他方法在销毁后抛出异常（`stopCamera` 可重复调用）。

将整个 `module-dist` 复制到宿主静态资源目录。默认模型地址为 `/mediapipe/hand_landmarker.task` 和 `/mediapipe/wasm`；部署在子路径时传入正确的 `modelAssetPath`、`wasmPath`。需要 localhost 或 HTTPS；WebView/iframe 的摄像头权限由宿主配置。未接入具体桌面插件协议。

直接浏览器加载 ES 模块，或使用 UMD 脚本 `plan-graph-module.umd.cjs` 后调用 `window.PlanGraphModule.mountPlanGraph`。UMD 文件需要以 JavaScript MIME 类型提供。本地 npm 安装可使用 `npm install D:/AI/codex/gesture-plan-app`，再 `import { mountPlanGraph } from 'gesture-plan-app'`。

`npm run build:module` 输出到 `module-dist`，`npm run build` 输出到 `dist`，互不覆盖。`module-example.html` 是最小宿主，`nebula.html` 是参考图风格的完整宿主演示。旧计划管理页面保留在 `/`。模型、WASM 与库的许可证请随分发保留，依赖版本记录在 package-lock.json。
