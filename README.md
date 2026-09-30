# Star E-Commerce ERP

面向跨境电商平台商户的后台管理系统，基于 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) v5.7.0 与 [yudao-ui-admin-vben](https://github.com/yudaocode/yudao-ui-admin-vben) 构建。

## 环境要求

- Node.js >= 22.18.0（推荐 v24），见 `.node-version`
- pnpm >= 11.0.0（强制使用 pnpm）

## 快速开始

```bash
pnpm install
pnpm dev:antd
```

- 前端访问地址：<http://localhost:5666>
- 默认请求本地后端 `http://127.0.0.1:48080` 的 `/admin-api`，见 `apps/web-antd/.env.development`

## 常用命令

| 命令                 | 说明                  |
| -------------------- | --------------------- |
| `pnpm dev:antd`      | 启动 web-antd 开发服务器 |
| `pnpm build:antd`    | 构建 web-antd 生产包  |
| `pnpm check:type`    | 全仓类型检查          |
| `pnpm lint`          | 代码检查              |
| `pnpm test:unit`     | 单元测试              |
| `pnpm build:docker`  | 构建本地 Docker 镜像  |

## 目录结构

- `apps/web-antd`：主应用（Vue3 + Ant Design Vue）
- `packages/`：共享能力包（`@vben/*`、`@vben-core/*`）
- `internal/`：构建与工程化配置

## 许可证

[MIT](LICENSE)
