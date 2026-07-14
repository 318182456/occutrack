# OccuTrack 家庭护眼卫士

专为家庭设计的儿童眼科遮盖（弱视训练）追踪助手，帮助家长科学记录并鼓励宝贝健康遮眼。

## 功能特点

- **智能遮盖追踪**：科学记录每日遮盖时长与训练进度。
- **趣味化打卡**：通过趣味交互与打卡，鼓励宝贝坚持完成遮盖疗法。
- **家长数据分析**：为家长提供直观的数据统计与视力恢复追踪。
- **云端同步**：通过 Cloudflare Workers + KV 自动进行多端数据同步。

## 本地开发与运行

### 前提条件

- [Node.js](https://nodejs.org/) (推荐 v18+)

### 步骤

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **配置环境变量**：
   将根目录下的 `.env.example` 复制并重命名为 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```
   并在 `.env.local` 中配置服务 URL（可选）：
   ```env
   APP_URL="http://localhost:5173"
   ```

3. **启动本地开发服务器**：
   ```bash
   npm run dev
   ```

4. **构建项目**：
   ```bash
   npm run build
   ```

5. **Cloudflare Workers 本地调试与部署**：
   - 本地调试：`npm run dev:worker`
   - 部署：`npm run deploy`
