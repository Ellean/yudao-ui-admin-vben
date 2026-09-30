# Star E-Commerce ERP 品牌迁移收尾指南

> 本文档记录品牌迁移（`rebrand/star-ecom-erp` 分支）后**有意保留**的项与**待办清理**项。基线：vue-vben-admin v5.7.0 / yudao-ui-admin-vben 上游，迁移决策经评审后执行。

## 1. DocAlert 与 doc.iocoder.cn 链接（待清理，当前保留）

### 现状统计（2026-09-30）

| 指标 | 数值 |
| --- | --- |
| `<DocAlert>` 标签 | 315 处（69 处单行自闭合，246 处多行自闭合，均无子内容） |
| 涉及文件 | `apps/web-antd/src` 下 278 个 `.vue` 文件 |
| `doc.iocoder.cn` URL | 316 处，**全部**位于 DocAlert 标签内 |
| 组件源码 | `packages/effects/common-ui/src/components/doc-alert/` |
| 环境开关 | `apps/web-antd/.env` 第 20 行 `VITE_APP_DOCALERT_ENABLE=true` |

渲染逻辑：`isDocAlertEnable()`（`packages/effects/hooks/src/use-app-config.ts:46`）判断 `VITE_APP_DOCALERT_ENABLE !== 'false'`。`Page` 组件的 `doc` 插槽同样受此开关控制（`packages/effects/common-ui/src/components/page/page.vue:31`）。

### 方案 A：一键隐藏（零代码改动）

```bash
# apps/web-antd/.env
VITE_APP_DOCALERT_ENABLE=false
```

适合商户交付版本：所有 DocAlert 横幅与 `doc` 插槽不再渲染，代码零侵入，可随时回退。内部开发环境可保持 `true` 方便查阅芋道后端文档。

### 方案 B：代码级彻底移除

```bash
# 1) 移除模板中的 <DocAlert ... /> 标签（单行与多行自闭合均覆盖）
rg -l '<DocAlert' apps/web-antd/src --glob '*.vue' \
  | xargs perl -0777 -pi -e 's/\n[ \t]*<DocAlert\b.*?\/>//gs'

# 2) 从 import 列表中移除 DocAlert（覆盖前/中/后三种位置）
rg -l 'DocAlert' apps/web-antd/src --glob '*.vue' \
  | xargs perl -pi -e 's/\bDocAlert,\s*//g; s/,\s*DocAlert\b//g'

# 3) 删除可能残留的空 import 与空行
rg -l "import \{\s*\} from '@vben/common-ui'" apps/web-antd/src --glob '*.vue' \
  | xargs perl -pi -e "s/import \{\s*\} from '\@vben\/common-ui';\n//"

# 4) 验证（两条都应无输出）
rg -n 'DocAlert|doc\.iocoder\.cn' apps/web-antd/src
```

组件级移除（可选，在方案 B 验证通过后）：

```bash
rm -rf packages/effects/common-ui/src/components/doc-alert
# packages/effects/common-ui/src/components/index.ts 删除: export * from './doc-alert';
# packages/effects/common-ui/src/components/page/page.vue 删除 isDocAlertEnable 与 doc 插槽的 v-if 条件
# packages/effects/hooks/src/use-app-config.ts 删除 isDocAlertEnable()
# apps/web-antd/.env 删除 VITE_APP_DOCALERT_ENABLE
```

移除后跑 `pnpm dev:antd` 抽查 ERP / CRM / 商城各一个列表页确认无空白横幅残留。

## 2. 有意保留的 yudao/iocoder 残留（约 37 行，勿清理）

以下内容不是遗漏，而是**必须或应该保留**：

- **后端配置键**：`apps/web-antd/src/views/im/utils/config.ts` 等处的 `yudao.im.*` Spring 配置键注释 —— 与配对后端 ruoyi-vue-pro 的实际配置键一致，改动会导致注释失真。
- **上游 issue/PR 引用注释**：代码注释中引用 gitee/github yudaocode 的问题链接，属于技术决策溯源。
- **TODO @芋艿 注释**：上游作者遗留的待办标注，跟随上游同步时便于比对。
- **`apps/web-antd/src/router`（guard.ts / access.ts）注释**：说明路由守卫设计来源。
- **功能默认值/示例数据**：
  - 商城装修编辑器默认模板图（`views/mall/promotion/components/diy-editor/components/mobile/{tab-bar,notice-bar,carousel}/config.ts`）指向 `static.iocoder.cn` / `mall.yudao.iocoder.cn` 公共 CDN —— 替换需自备示例图素材；
  - `views/infra/skywalking/index.vue:9` 的 iframe 指向芋道演示监控实例 —— 替换需自建 SkyWalking；
  - `views/_core/authentication/sso-login.vue:38-39` 注释中的示例 SSO 回调 URL。
- **cspell.json 的 "yudao" 词条**：上述注释/配置键仍包含该词，移除后拼写检查会报错。

审计命令（Phase 5 执行过一次）：

```bash
rg -n 'yudao|芋道|iocoder' --glob '!**/node_modules/**' --glob '!pnpm-lock.yaml' .
```

新增代码若引入芋道文案，应在提交前清理；上表之外的新残留需说明理由。

## 3. 已知环境问题（macOS 13 x64 开发机）

| 问题 | 现象 | 处置 |
| --- | --- | --- |
| `rolldown` 原生绑定 | `@rolldown/binding-darwin-x64` 要求 macOS 14，报 "VM initialization failed" 后进程死锁（0% CPU） | 本机**不要跑** `pnpm build:antd`；生产构建走 CI（ubuntu-latest）或 macOS 14+ 机器。死锁进程需 `pkill -f vite/tsdown` 清理 |
| `sass-embedded` | dev 模式报 "Tried writing to closed dispatcher"（预转换阶段） | **非阻塞**，dev 功能正常，可忽略 |
| `oxlint-tsgolint` | typecheck 阶段 VM 初始化失败 | 本机 typecheck 用 `vue-tsc` 途径（`pnpm check:type`）仍可用 |

长任务建议：`nohup <command> > /tmp/<name>.log 2>&1 &` 后轮询日志，避免终端挂断丢输出。

## 4. 既有 typecheck 债务（66 个错误，非本次迁移引入）

`pnpm check:type` 在 web-antd 报 66 个 TS 错误，经 stash 对照测试证明在迁移前即存在（crm/im/hrm/system/bpm/mall/ai/xq 业务视图，主要是 FormSchemaContext 签名迁移与隐式 any）。

当前处置：

- `lefthook.yml` 的 `checkType` 仅对 `@vben/constants`、`@vben/common-ui` 做类型检查（web-antd 的错误会阻塞每次提交）。
- `.github/workflows/ci.yml` **暂未加入 typecheck job**。

**还清债务后**：把 66 个错误修完，然后恢复 CI typecheck job 并放宽 lefthook 范围。

### 全量 lint 债务（非本次迁移引入）

`pnpm run lint` 全仓运行在迁移前即不通过（lefthook 只检查暂存文件，掩盖了这一点）：

- oxfmt 格式问题 47 个文件（pms/xq/hrm/iot/bpm 业务代码为主）；
- oxlint 63 个错误（`catch-error-name`、`unified-signatures` 等，全部位于业务视图）；
- eslint 1 个 `vue/no-v-html` 警告（`views/xq/product/library/index.vue:753`）。

已核实以上无一位于本次迁移改动的文件中。Phase 5 已修复迁移自身引入的部分：删除 `pnpm-workspace.yaml` 中 14 个因裁剪 UI 壳/文档站而不再使用的 catalog 条目，并修复 README.md / docs/rebrand-cleanup.md 的 markdown 格式（lefthook 不检查 md/yaml，全量 lint 才会暴露）。想一次性还清格式债：`pnpm exec vsh lint --format`（自动修复 oxfmt 部分，oxlint 错误需手工）。

## 5. 收尾核对清单

- [ ] DocAlert 移除（方案 A 或 B，见第 1 节）
- [ ] favicon / logo 美术资产替换（`apps/web-antd/public/favicon.ico`、`logo.png` 等仍是 vben 视觉，待设计稿）
- [ ] GitHub 仓库改名 `yudao-ui-admin-vben` → `star-ecom-erp` 并同步本地 remote： `git remote set-url origin git@github.com:Ellean/star-ecom-erp.git`
- [ ] 修复 66 个既有 typecheck 错误后恢复 CI typecheck job
- [ ] 业务模块裁剪决策（mall/crm/erp/im 等是否保留，当前全部保留）
- [ ] `VITE_APP_NAMESPACE` 改为 `star-ecom-erp` 后 localStorage 键前缀变化 —— 部署到已存在用户的环境会强制重新登录（预期行为，发布说明需提及）
