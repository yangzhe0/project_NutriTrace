# 部署说明

演示：https://sa.zheoi.com/  
项目书：https://sa.zheoi.com/docs/proposal.html  
PDF：https://sa.zheoi.com/docs/proposal.pdf

## 本地与常规服务器

Node.js 22+，运行 `npm start`。通过 `.env` 或环境变量配置；变量名见 `.env.example`。默认监听 127.0.0.1:8765。对局域网或容器开放时，将 `FOODLEDGER_HOST` 设为 0.0.0.0。

模型 API 密钥仅在服务端读取，不要写入 HTML、前端脚本、Git 命令或提交记录。没有密钥时，台账和营养计算仍可用，聊天选择离线示例。

## 现有域名服务

域名反向代理到 **HTTP** 源站 `http://localhost:8765`，对外继续使用 HTTPS。`FOODLEDGER_PUBLIC_ORIGIN` 应与公网域名一致。

现有 Linux 服务采用用户级 systemd `shiji-demo.service`，运行目录为用户应用目录中的 `shiji-demo/current`，发行版保留在同级 `releases/`。先上传并核验新目录，再切换 current 并重启服务，保留旧发行版用于回退。

现有服务把密钥保留在 systemd 用户管理器的内存中；重启应用可保留，整机重启后须重新注入。`tools/deploy.py` 从标准输入接收配置，不接受命令行中的明文密钥。用于其他主机时，应先核对工具中的路径和域名设置。

## 项目资料与兼容路径

规范路径为 `docs/proposal.html`、`docs/proposal.pdf`、`docs/references.html`；旧 C 版链接与旧 PDF 地址由服务端重定向，已发出的链接仍可打开。报名 Word 和签字附件不部署到网站。
