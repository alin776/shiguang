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
