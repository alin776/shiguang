# 时光 (shiguang)

一个基于 Vue 3 的移动端日程管理+日常分享应用，帮助用户记录和管理每一刻美好时光。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 功能特点

- 📅 日程管理：创建、编辑、删除日程安排
- 👥 社区互动：发帖分享、评论互动、关注用户
- 👤 个人中心：个人资料管理、我的帖子、我的点赞
- 🌓 深色模式：自动适配系统深色模式
- 📱 响应式设计：完美适配移动端和桌面端
- 🔔 消息通知：实时接收互动消息提醒
![Image](https://github.com/user-attachments/assets/96d85565-80ab-4cab-96c1-7979ec977a17)

## 技术栈

### 前端

- Vue 3
- Vue Router
- Pinia
- Element Plus
- Axios
- Dayjs

### 后端

- Node.js
- Express
- MySQL
- JWT

## 安装步骤

### 前端部署

1. 克隆项目

```bash
git clone https://github.com/alin776/shiguang.git
cd shiguang
```

2. 安装依赖

```bash
npm install
```

3. 开发环境运行

```bash
npm run dev
```

4. 生产环境构建

```bash
npm run build
```

### 后端部署

1. 进入服务器端目录

```bash
cd server
```

2. 安装依赖

```bash
npm install
```

3. 配置数据库

- 创建 MySQL 数据库
- 导入 `server/database/schema.sql` 文件
- 配置 `server/config/database.js` 中的数据库连接信息

4. 启动服务

```bash
node app.js
```

## 项目配置

### 前端配置

编辑 `vite.config.js` 文件，修改后端 API 地址：
javascript
server: {
proxy: {
'/api': {
target: 'http://your-api-domain:3000',
changeOrigin: true,
}
}
}
搜索所有前端文件中的 `target: 'http://47.98.210.7:3000'` 并替换为 `target: 'http://你的后端域名:3000'`

### 后端配置

在 `server/config` 目录下创建 `.env` 文件：

env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=time_calendar
JWT_SECRET=your_jwt_secret

## 目录结构

├── public/ # 静态资源
├── src/
│ ├── assets/ # 项目资源文件
│ ├── components/ # 公共组件
│ ├── router/ # 路由配置
│ ├── stores/ # Pinia 状态管理
│ ├── utils/ # 工具函数
│ └── views/ # 页面组件
├── server/ # 后端服务
│ ├── config/ # 配置文件
│ ├── controllers/ # 控制器
│ ├── database/ # 数据库文件
│ ├── middleware/ # 中间件
│ └── routes/ # 路由
└── package.json

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目基于 Apache License 2.0 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解更多详情

## 版权声明

Copyright 2024 alin776

根据 Apache License 2.0 许可证的要求:

1. 任何人在使用本项目代码时必须保留此版权声明
2. 需要在显著位置说明是否对代码进行了修改
3. 需要保留原作者信息和项目链接
4. 如果您修改了代码，需要在被修改的文件中说明

详细说明请参考 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

## 联系方式

项目作者 - [@alin776](https://github.com/alin776)

项目链接: [https://github.com/alin776/shiguang](https://github.com/alin776/shiguang)
