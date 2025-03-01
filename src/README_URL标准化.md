# 时光日历 - URL和配置标准化指南

## 概述

为了提高代码的可维护性和灵活性，我们对项目中的URL和关键配置进行了集中管理。这样做的好处是：

1. 减少硬编码的配置项
2. 提高代码的可维护性
3. 方便未来环境变更（如服务器迁移、域名变更等）
4. 减少重复代码和逻辑错误

## 如何使用集中化配置

### 1. 导入所需的配置

在你的Vue组件或JS文件中，从配置文件导入所需的配置项：

```javascript
import { API_BASE_URL, UPLOAD_ENDPOINTS, API_ENDPOINTS } from "@/config";
```

### 2. 替换硬编码的URL

将代码中所有硬编码的URL替换为配置中的常量：

```javascript
// 替换前
const API_BASE_URL = "http://47.98.210.7:3000";
:action="`${API_BASE_URL}/api/upload/avatar`"

// 替换后
import { API_BASE_URL, UPLOAD_ENDPOINTS } from "@/config";
:action="`${API_BASE_URL}${UPLOAD_ENDPOINTS.AVATAR}`"
// 或者使用别名兼容现有代码
:action="`${API_BASE_URL}${UPLOAD_ENDPOINTS.uploadAvatar}`"
```

### 3. 使用统一的图片URL处理函数

使用`utils/imageHelpers.js`中提供的工具函数处理图片URL：

```javascript
import { getAvatarUrl, getImageUrl } from "@/utils/imageHelpers";

// 处理头像URL
const avatarUrl = getAvatarUrl(user.avatar);

// 处理普通图片URL
const imageUrl = getImageUrl(post.image);
```

## 标准化步骤

在每个组件中执行以下标准化步骤：

1. 移除所有本地定义的`API_BASE_URL`常量
2. 在`script`部分导入所需的配置项
3. 将上传URL中的硬编码路径替换为配置常量
4. 使用`getAvatarUrl`和`getImageUrl`函数处理所有图片URL

## 示例改造

### EditProfileView.vue

```javascript
// 替换前
const API_BASE_URL = "http://47.98.210.7:3000";
:action="`${API_BASE_URL}/api/upload/cover`"

// 替换后
import { API_BASE_URL, UPLOAD_ENDPOINTS } from "@/config";
:action="`${API_BASE_URL}${UPLOAD_ENDPOINTS.uploadCover}`"
```

### UserProfileView.vue

```javascript
// 替换前
const API_BASE_URL = "http://47.98.210.7:3000";
const getCoverUrl = (cover) => {
  // 复杂的处理逻辑...
};

// 替换后
import { API_BASE_URL } from "@/config";
import { getImageUrl } from "@/utils/imageHelpers";

const getCoverUrl = (cover) => {
  if (!cover) return defaultCover;
  return getImageUrl(cover);
};
```

## 配置项说明

### API_BASE_URL

API服务器的基础URL，所有API请求都基于此URL。

### UPLOAD_PATHS

上传文件的存储路径：

- `AVATARS` - 头像存储路径
- `POSTS` - 帖子图片存储路径
- `COVERS` - 封面图存储路径

### UPLOAD_ENDPOINTS

上传文件的API端点：

- `AVATAR` - 上传头像的端点
- `COVER` - 上传封面的端点
- `POST` - 上传帖子图片的端点

### API_ENDPOINTS

所有API端点的集合，按功能分类。

## 新功能开发注意事项

当开发新功能时：

1. 不要在代码中硬编码URLs或关键配置
2. 为新的API端点或配置项在`config.js`中添加相应的常量
3. 使用`getAvatarUrl`和`getImageUrl`处理所有图片URL
4. 通过导入配置文件中的常量使用集中配置
