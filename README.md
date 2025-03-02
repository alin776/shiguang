# 时光 (shiguang)

一个现代化的日程管理与社交分享平台，为您记录生活中的每一个瞬间。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 项目介绍

"时光"是一款融合日程规划、习惯养成与社区互动的多功能 Web 应用。它不仅帮助用户高效管理时间，还为用户提供一个分享生活、记录成长的社交平台。应用采用现代 UI 设计，宇宙粒子风格界面给用户带来沉浸式体验。

## 核心功能

### 日程管理

- 创建、编辑和删除日程安排
- 多视图日历展示（月视图/周视图）
- 日程提醒与优先级设置
- 循环日程支持

### 习惯养成

- 自定义打卡项目
- 连续打卡统计
- 习惯养成数据分析

### 社区互动

- 分享生活动态
- 图文内容发布
- 点赞评论功能
- 用户关注系统

### 个人空间

- 个性化资料设置
- 头像和封面管理
- 帖子与点赞内容管理
- 关注和粉丝列表

### 外观与体验

- 宇宙粒子风格界面
- 深色模式支持
- 响应式设计适配多端
- 流畅动画与过渡效果

## 技术架构

### 前端

- **核心框架**: Vue 3 (组合式 API)
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **UI 组件库**: Element Plus
- **HTTP 请求**: Axios
- **样式处理**: SCSS
- **构建工具**: Vite

### 后端

- **运行环境**: Node.js
- **Web 框架**: Express
- **数据库**: MySQL
- **身份验证**: JWT
- **文件处理**: Multer
- **API 文档**: Swagger

## 快速开始

### 开发环境设置

1. 克隆仓库

```bash
git clone https://github.com/alin776/shiguang.git
cd shiguang
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

### 后端服务配置

1. 进入服务器目录

```bash
cd server
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量
   创建 `.env` 文件在 `server/config` 目录下:

```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=time_calendar
JWT_SECRET=your_jwt_secret
```

4. 启动服务器

```bash
npm run start
```

## 部署指南

### 前端部署

更新 API 配置：

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://your-domain.com:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### 后端部署

1. 设置生产环境变量

```
NODE_ENV=production
PORT=3000
```

2. 配置数据库

- 创建生产环境数据库
- 执行 `server/database/schema.sql` 初始化表结构

3. 使用 PM2 管理 Node 进程

```bash
npm install -g pm2
pm2 start app.js --name "shiguang-server"
```

## 项目结构

```
├── public/                 # 静态资源
├── src/
│   ├── assets/             # 项目资源文件
│   ├── components/         # 公共组件
│   │   └── BottomNavBar.vue # 底部导航栏
│   ├── composables/        # 组合式函数
│   ├── config/             # 全局配置
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia状态管理
│   ├── utils/              # 工具函数
│   └── views/              # 页面组件
│       ├── calendar/       # 日历相关页面
│       ├── post/           # 帖子相关页面
│       └── AboutView.vue   # 关于我们页面
├── server/                 # 后端服务
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   ├── database/           # 数据库文件
│   ├── middleware/         # 中间件
│   ├── routes/             # 路由
│   └── app.js              # 主程序
└── package.json            # 项目配置
```

## 浏览器兼容性

- Chrome 87+
- Firefox 78+
- Safari 14+
- Edge 88+

## 贡献指南

我们欢迎各种形式的贡献！

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 许可说明

本项目采用 Apache License 2.0 许可证 - 详情请查看 [LICENSE](LICENSE) 文件

## 版权声明

Copyright © 2024 alin776. All Rights Reserved.

根据 Apache License 2.0 许可证要求:

- 使用本项目代码时必须保留此版权声明
- 需在显著位置说明对代码的任何修改
- 需保留原作者信息和项目链接

本软件由 alin776 独立开发完成  
首次发布时间: 2025 年 2 月 23 日  
GitHub: https://github.com/alin776/shiguang

## 联系我们

开发者: [@alin776](https://github.com/alin776)  
项目地址: [https://github.com/alin776/shiguang](https://github.com/alin776/shiguang)
