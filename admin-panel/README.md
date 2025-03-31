# 时光App管理后台

这是时光App的管理后台系统，用于管理帖子、用户及其他相关功能。

## 功能特性

- 帖子管理：查看、编辑、删除社区内的帖子
- 用户管理：管理用户账号和权限
- 数据统计：查看平台数据和活动

## 技术栈

- Vue 3
- Vite
- Element Plus
- Vue Router
- Pinia
- Axios

## 开发环境要求

- Node.js 16.0+
- npm 或 yarn

## 安装

```bash
# 进入项目目录
cd admin-panel

# 安装依赖
npm install
# 或
yarn install
```

## 本地开发

```bash
# 启动开发服务器
npm run dev
# 或
yarn dev
```

默认访问地址: http://localhost:5174

## 构建生产版本

```bash
# 构建生产版本
npm run build
# 或
yarn build
```

构建输出将位于 `dist` 目录中。

## 预览生产版本

```bash
# 预览构建结果
npm run preview
# 或
yarn preview
```

## API 连接

管理后台默认连接到本地后端服务 `http://localhost:3000`。 

如需修改 API 连接地址，请编辑 `vite.config.js` 中的 `server.proxy` 配置：

```js
server: {
  proxy: {
    '/api': {
      target: '你的API地址',
      changeOrigin: true,
      rewrite: (path) => path
    },
  }
}
```

## 布署提示

1. 构建前端资源
2. 将 `dist` 目录中的文件上传到服务器
3. 配置服务器（Nginx, Apache等）将API请求代理到实际后端

## 许可证

私有软件，未经授权不得使用或分发。 