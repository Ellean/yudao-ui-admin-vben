# AGENTS.md — Star E-Commerce ERP

本文件供 AI Agent 处理本仓库时作为知识库入口。

## 项目身份

- 名称：Star E-Commerce ERP（跨境电商平台商户后台）
- 技术：Vue3 + Vben Admin 5.7.0 monorepo（pnpm + turbo），唯一 UI 壳 `apps/web-antd`（Ant Design Vue）
- 配对后端：ruoyi-vue-pro（端口 48080，`/admin-api`）

## 开发

```bash
pnpm install
pnpm dev:antd
```

- 前端端口：5666
- `VITE_BASE_URL=http://127.0.0.1:48080`

## 目录要点

- `apps/web-antd/src/api` + `src/views`：业务按域划分（system/erp/crm/mall…）
- `packages/`：共享能力（`@vben/*`、`@vben-core/*`）
- `internal/`：构建与工程化配置

## Agent 行为

1. 未指定 UI 壳时默认改 `web-ele`；XQ 产品工作台在 **`web-antd`**
2. 新接口先写 `api` 再写 `views`
3. 与后端模块开关保持一致，勿依赖未启用模块的接口
4. 包管理只用 pnpm；Node ≥ 22.18
5. 文档：https://doc.iocoder.cn/quick-start/
6. **Git 提交**：遵守 commitlint（见 `.cursor/rules/commitlint-frontend.mdc`）
   - 格式：`type(@vben/web-antd): subject`（scope 必须带 `@vben/` 前缀）
   - **body 每一行 ≤ 100 字符**；宁可无 body，也不写超长句
   - 禁止为绕过 hook 使用 `--no-verify`（除非用户明确要求）
