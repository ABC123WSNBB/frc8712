# 冯若辰｜AI Signal Profile

纯 HTML、CSS 和原生 JavaScript 构建的个人在线简历，支持直接双击打开，也可部署到 Netlify、GitHub Pages 等静态托管平台。

在线访问：<https://frccrf.netlify.app>

## 功能

- 响应式桌面和移动端布局
- AI Signal 首屏与轻量 Canvas 数据流动画
- 8 项 AI 专项认证、4 条学习路径和证书灯箱
- 亮点成果、实践经历、技能、教育与荣誉
- 深浅主题、键盘操作、打印样式和减少动画模式
- 背景音乐延迟加载：进入网站前不会请求 61 MB 音频

## 目录

```text
index.html
assets/
  audio/             背景音乐
  certificates/      AI 认证图片
  css/styles.css     全站样式
  images/profile.jpg 个人图片
  js/resume-data.js  唯一内容数据源
  js/app.js          页面渲染与交互
```

## 使用和修改

1. 双击 `index.html` 即可离线查看。
2. 修改个人内容时编辑 `assets/js/resume-data.js`。
3. 替换图片时保持相对路径不变，或同步修改数据文件中的路径。
4. Netlify 部署时上传生产文件夹或解压后的提交包，不要上传 `_archive`。

## 隐私与真实性

- 公开版只显示 QQ，不包含手机号。
- AI 能力描述以现有专项认证和实际学习为依据，不代表未经证明的项目或工作经验。
