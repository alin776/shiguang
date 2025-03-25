# 时光 (shiguang)

一个现代化的生活休闲社区平台，为用户提供分享生活点滴和交流互动的空间。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 项目介绍

"时光"是一款专注于生活分享与社区互动的多功能社交平台。它为用户提供了一个温馨的社区空间，可以分享日常生活、记录成长、参与互动游戏、完成任务挑战、获取积分奖励以及发现志同道合的朋友。应用采用简约现代的设计风格，双列瀑布流布局，为用户带来流畅舒适的浏览体验。

## 核心功能

### 社区互动

- 瀑布流布局的内容浏览
- 三种内容排序方式（最新、最热、推荐）
- 分类筛选系统
- 帖子搜索功能
- 帖子详情查看
- 关注用户和关注内容流
- 用户资料页面查看

### 内容发布

- 图文内容创建与编辑
- 多图片上传与预览
- 分类标签选择
- 富文本编辑支持
- 笔记编辑与发布
- 临时草稿保存

### 互动功能

- 帖子点赞系统
- 评论与回复功能
- 本地点赞状态保存
- 评论点赞功能
- 用户关注系统
- 通知消息系统

### 用户系统

- 用户注册与登录
- 个人主页与资料设置
- 用户头像管理
- 密码管理（修改密码、找回密码）
- 用户称号与等级系统
- 用户验证系统

### 游戏与活动

- 卡牌游戏系统
- 小镇互动系统
- 活动中心
- 日历事件系统
- 每日签到奖励
- 任务中心

### 积分与奖励

- 积分获取系统
- 积分商城兑换
- 完成任务获取奖励
- 连续签到奖励机制

### 管理功能

- 后台管理系统
- 内容审核机制
- 用户管理功能
- 公告发布系统
- 数据统计与分析
- 活动管理系统

### 其他功能

- 自动更新检查系统
- 版本历史记录
- 用户反馈系统
- 系统公告查看
- 跨平台支持（Web、Android）

## 技术栈

### 前端

- **框架**: Vue 3 (组合式 API)
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI组件**: Element Plus
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **移动应用**: Capacitor (Android)

### 后端

- **运行环境**: Node.js
- **Web框架**: Express
- **数据库**: MySQL
- **认证**: JWT
- **文件上传**: Multer
- **邮件服务**: Nodemailer
- **定时任务**: Node-cron
- **跨域处理**: CORS

## 项目结构

```
├── admin-panel/            # 管理员面板
├── android/                # Android应用配置
├── public/                 # 静态资源
├── server/                 # 后端服务
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   │   ├── adminController.js     # 管理员功能
│   │   ├── authController.js      # 认证控制
│   │   ├── communityController.js # 社区功能
│   │   ├── cardGameController.js  # 卡牌游戏
│   │   ├── taskController.js      # 任务系统
│   │   ├── pointsProductController.js # 积分商城
│   │   ├── TownController.js      # 小镇系统
│   │   ├── notificationController.js # 通知系统
│   │   ├── updateController.js    # 更新系统
│   │   └── ...
│   ├── database/           # 数据库相关
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型
│   ├── routes/             # 路由定义
│   ├── services/           # 服务层
│   ├── scripts/            # 脚本工具
│   ├── uploads/            # 上传文件目录
│   └── app.js              # 服务器入口文件
├── src/
│   ├── assets/             # 资源文件
│   ├── components/         # 公共组件
│   ├── composables/        # 组合式函数
│   ├── config/             # 配置文件
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia状态仓库
│   ├── utils/              # 工具函数
│   ├── views/              # 页面组件
│   │   ├── CommunityView.vue  # 社区主页
│   │   ├── CardGameView.vue   # 卡牌游戏
│   │   ├── TownView.vue       # 小镇系统
│   │   ├── ProfileView.vue    # 个人资料
│   │   ├── TaskCenterView.vue # 任务中心
│   │   ├── PointsExchangeView.vue # 积分商城
│   │   ├── NotificationsView.vue # 通知页面
│   │   └── ...
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── .env                    # 环境变量
├── capacitor.config.ts     # Capacitor配置
├── vite.config.js          # Vite配置
└── package.json            # 项目配置
```

## 快速开始

### 前端开发

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

### 后端开发

1. 进入服务器目录

```bash
cd server
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量
   创建 `.env` 文件在 `server` 目录下:

```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=shiguang
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail
PORT=3000
```

4. 创建数据库表结构

```bash
# 使用MySQL客户端连接到数据库
mysql -u your_username -p

# 在MySQL中创建数据库
CREATE DATABASE shiguang;
USE shiguang;

# 导入数据库表结构
SOURCE server/database/schema.sql;
```

5. 启动后端服务器

```bash
npm start
```

### 管理面板开发

1. 进入管理面板目录

```bash
cd admin-panel
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

## 部署指南

### 前端部署

1. 修改API配置

在 `src/config.js` 中更新API基础URL:

```javascript
export const API_BASE_URL = 'https://your-domain.com/api';
```

2. 构建生产版本

```bash
npm run build
```

3. 部署到Web服务器

将 `dist` 目录中的文件部署到Nginx、Apache或其他Web服务器。

### 后端部署

1. 准备服务器环境

- 安装Node.js (推荐v16+)
- 安装MySQL (推荐v8.0+)
- 设置防火墙开放需要的端口

2. 配置生产环境变量

创建 `.env` 文件:

```
NODE_ENV=production
DB_HOST=localhost
DB_USER=production_user
DB_PASSWORD=secure_password
DB_NAME=shiguang_prod
JWT_SECRET=strong_random_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail
PORT=3000
```

3. 使用PM2管理Node进程

```bash
npm install -g pm2
pm2 start app.js --name "shiguang-server"
pm2 startup
pm2 save
```

4. 设置Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Android版本部署

1. 安装Capacitor依赖

```bash
npm install @capacitor/core @capacitor/android
```

2. 构建前端应用

```bash
npm run build
```

3. 同步Capacitor资源

```bash
npx cap sync
```

4. 打开Android Studio进行构建

```bash
npx cap open android
```

5. 在Android Studio中生成签名APK

## 自动更新系统指南

时光App现已集成了自动更新检查和远程更新系统，以确保用户总能使用最新版本。以下是更新系统的主要功能和部署说明：

### 功能概述

- **自动版本检查**：应用启动时自动检查新版本
- **手动检查更新**：用户可在设置中手动触发检查
- **版本历史记录**：显示应用所有版本的历史记录
- **跨平台支持**：支持Web、Android平台
- **强制更新选项**：可设置必须更新的版本

### 部署指南

#### 后端部署

1. 更新服务器端应用版本配置：编辑`server/controllers/updateController.js`文件中的版本信息：

```js
const appVersions = {
  // Android版本信息
  android: [
    {
      version: '1.1.0',  // 版本号
      buildNumber: '2',  // 构建号
      releaseDate: '2024-03-17', // 发布日期
      forceUpdate: false, // 是否强制更新
      releaseNotes: `...`, // 更新说明
      downloadUrl: 'https://你的下载服务器地址/shiguang-1.1.0.apk', // 下载地址
      minOsVersion: '8.0.0' // 最低操作系统版本
    },
    // ...更多版本
  ],
  
  // 其他平台版本配置类似
}
```

2. 发布新版本APK到您的下载服务器，确保`downloadUrl`地址正确

#### 前端配置

1. 更新`package.json`中的版本号：

```json
{
  "name": "shiguang",
  "private": true,
  "version": "1.1.0"
}
```

2. Android版本更新：
   - 修改`capacitor.config.ts`中的版本号
   - 使用Capacitor构建新版本APK

## 游戏与互动系统

### 卡牌游戏

时光平台集成了互动卡牌游戏系统，用户可以：
- 收集各种稀有度的卡牌
- 完成特定任务获取卡牌
- 查看卡牌详情和收藏状态
- 体验游戏化社交互动

### 小镇系统

虚拟小镇互动系统提供：
- 用户个人小镇空间
- 互动建筑功能
- 小镇升级机制
- 社交互动功能

## 任务与积分系统

### 任务中心

用户可以通过完成各种任务获取积分和奖励：
- 每日任务
- 成长任务
- 特殊活动任务
- 连续签到奖励

### 积分商城

获取的积分可以在积分商城兑换多种奖励：
- 虚拟物品
- 特殊称号
- 限定头像框
- 其他平台特权

## 浏览器兼容性

- Chrome 90+
- Firefox 80+
- Safari 14+
- Edge 90+

## 贡献指南

我们欢迎任何形式的贡献与改进！

1. Fork 本仓库
2. 创建你的特性分支: `git checkout -b feature/amazing-feature`
3. 提交你的更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可说明

本项目采用 Apache License 2.0 许可证 - 详情请查看 [LICENSE](LICENSE) 文件

## 版权声明

Copyright © 2024 alin776. All Rights Reserved.

本软件由 alin776 独立开发完成  
GitHub: https://github.com/alin776/shiguang

## 联系我们

开发者: [@alin776](https://github.com/alin776)  
项目地址: [https://github.com/alin776/shiguang](https://github.com/alin776/shiguang)
