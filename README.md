# 时光 (shiguang)

一个现代化的生活休闲社区平台，为用户提供分享生活点滴和交流互动的空间。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 项目介绍

"时光"是一款专注于生活分享与社区互动的轻社交平台。它为用户提供了一个温馨的社区空间，可以分享日常生活、记录成长、发现志同道合的朋友。应用采用简约现代的设计风格，双列瀑布流布局，为用户带来流畅舒适的浏览体验。

## 核心功能

### 社区互动

- 瀑布流布局的内容浏览
- 三种内容排序方式（最新、最热、推荐）
- 分类筛选系统
- 帖子搜索功能
- 帖子详情查看

### 内容发布

- 图文内容创建与编辑
- 多图片上传与预览
- 分类标签选择
- 富文本编辑支持

### 互动功能

- 帖子点赞系统
- 评论与回复功能
- 本地点赞状态保存
- 评论点赞功能

### 用户系统

- 用户注册与登录
- 个人主页与资料设置
- 用户头像管理
- 消息通知系统

## 技术栈

### 前端

- **框架**: Vue 3 (组合式 API)
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI组件**: Element Plus
- **HTTP客户端**: Axios
- **构建工具**: Vite

### 后端

- **运行环境**: Node.js
- **Web框架**: Express
- **数据库**: MySQL
- **认证**: JWT
- **文件上传**: Multer
- **跨域处理**: CORS

## 项目结构

```
├── public/                 # 静态资源
├── src/
│   ├── assets/             # 资源文件
│   ├── components/         # 公共组件
│   │   ├── BottomNavBar.vue  # 底部导航栏
│   │   ├── NotificationBadge.vue # 通知徽章
│   │   └── ...
│   ├── config/             # 配置文件
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia状态仓库
│   │   ├── auth.js         # 认证状态
│   │   ├── community.js    # 社区相关状态
│   │   └── ...
│   ├── utils/              # 工具函数
│   │   ├── formatTime.js   # 时间格式化
│   │   ├── imageHelpers.js # 图片处理助手
│   │   └── ...
│   ├── views/              # 页面组件
│   │   ├── CommunityView.vue  # 社区主页
│   │   ├── PostView.vue    # 帖子详情页
│   │   ├── ProfileView.vue # 个人主页
│   │   └── ...
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── server/                 # 后端服务
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   │   ├── authController.js  # 认证控制器
│   │   ├── communityController.js # 社区控制器
│   │   └── ...
│   ├── middleware/         # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   └── ...
│   ├── routes/             # 路由定义
│   │   ├── auth.js         # 认证路由
│   │   ├── community.js    # 社区路由
│   │   └── ...
│   ├── uploads/            # 上传文件目录
│   └── app.js              # 服务器入口文件
├── .env                    # 环境变量
├── .gitignore              # Git忽略文件
├── package.json            # 项目配置
└── vite.config.js          # Vite配置
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

## 部署指南

### 前端部署

1. 修改API配置

在 `src/config/index.js` 中更新API基础URL:

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

## 自动更新系统指南

时光App现已集成了自动更新检查和远程更新系统，以确保用户总能使用最新版本。以下是更新系统的主要功能和部署说明：

### 功能概述

- **自动版本检查**：应用启动时自动检查新版本
- **手动检查更新**：用户可在设置中手动触发检查
- **版本历史记录**：显示应用所有版本的历史记录
- **跨平台支持**：支持Web、Android和iOS平台
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
  
  // iOS和Web版本配置类似
}
```

2. 发布新版本APK到您的下载服务器，确保`downloadUrl`地址正确

#### 前端配置

1. 更新`package.json`中的版本号：

```json
{
  "name": "shiguang",
  "private": true,
  "version": "1.1.0", // 更新版本号
  // ...
}
```

2. Android版本更新：
   - 修改`capacitor.config.ts`中的版本号
   - 使用Capacitor构建新版本APK：
   ```bash
   npm run build
   npx cap sync
   npx cap open android
   ```
   
3. iOS版本更新：
   - 更新App Store版本信息
   - 在`updateController.js`中更新`appStoreUrl`

### 测试更新系统

1. 设置低版本号测试：
   - 在前端设置较低版本号(如0.9.0)
   - 启动应用，应出现更新提示

2. 查看版本历史：
   - 进入"设置 -> 版本历史"查看完整版本记录

3. 手动检查更新：
   - 进入"设置 -> 检查更新"触发手动更新检查

### 注意事项

- Android平台更新需要APK签名一致
- iOS平台更新需通过App Store审核
- Web平台更新只需刷新页面即可应用新版本
- 建议使用[语义化版本号](https://semver.org/lang/zh-CN/)管理版本

## 功能截图

![社区首页](screenshots/community.png)
![帖子详情](screenshots/post-detail.png)
![发布内容](screenshots/create-post.png)

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
