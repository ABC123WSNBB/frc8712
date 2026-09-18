# Netlify 发布

生产站点已发布并完成 HTTP 200 验证：

<https://frccrf.netlify.app>

站点名称中是连续两个 `c`（`frccrf`），请勿误写成旧文档中的 `frcrf`。

后续首次使用 CLI 更新时，先运行 `netlify link --name frccrf` 绑定现有项目，再运行 `netlify deploy --prod --dir .`；也可以登录 Netlify 后上传生产文件夹。不要上传 `_archive` 文件夹。
