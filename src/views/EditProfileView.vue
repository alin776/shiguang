<template>
  <div class="edit-profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>编辑个人资料</h2>
      <button class="save-btn" :disabled="saving" @click="saveProfile">
        {{ saving ? "保存中..." : "保存" }}
      </button>
    </div>

    <!-- 封面图片 -->
    <div class="cover-image-wrapper">
      <div
        class="cover-image"
        :style="{
          backgroundImage: `url(${displayCover})`,
        }"
      >
        <div class="dark-overlay"></div>
        <el-upload
          class="upload-cover"
          :action="`${API_BASE_URL}/api/v1/users/upload/cover`"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleCoverSuccess"
          :before-upload="(file) => beforeUpload(file, 'cover')"
          :on-error="handleUploadError"
        >
          <div class="cover-update-btn">
            <el-icon><Camera /></el-icon>
            <span>更换背景</span>
          </div>
        </el-upload>
      </div>
    </div>

    <!-- 头像部分 -->
    <div class="avatar-container">
      <div class="avatar-wrapper">
        <el-avatar :size="80" :src="displayAvatar" @error="() => true">
          {{ form.username?.charAt(0).toUpperCase() || "?" }}
        </el-avatar>
        <el-upload
          class="upload-avatar"
          :action="`${API_BASE_URL}/api/users/upload/avatar`"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="(file) => beforeUpload(file, 'avatar')"
          :on-error="handleUploadError"
        >
          <div class="avatar-update-label">更换头像</div>
        </el-upload>
      </div>
    </div>

    <!-- 表单 -->
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="profile-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="个人简介">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="4"
            placeholder="介绍一下自己吧..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";
import { ArrowLeft, Camera } from "@element-plus/icons-vue";
import { getAvatarUrl, getImageUrl } from "@/utils/imageHelpers";
import { API_BASE_URL, UPLOAD_ENDPOINTS } from "@/config";

const router = useRouter();
const authStore = useAuthStore();

const defaultCover = "../default-cover.jpg"; // 添加默认封面图

// 添加上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`
}));

const saving = ref(false);
const form = ref({
  username: "",
  bio: "",
  email: "",
  avatar: "",
  coverImage: "",
});

onMounted(async () => {
  try {
    // 先获取最新的用户信息
    console.log("开始获取用户信息...");
    await authStore.fetchUserInfo();
    console.log("获取用户信息成功:", authStore.user);
    
    // 处理头像路径
    const avatar = authStore.user?.avatar;
    let avatarFileName = "";
    if (avatar) {
      const avatarMatches = avatar.match(/avatar-[\w-]+\.\w+$/);
      avatarFileName = avatarMatches ? avatarMatches[0] : "";
      console.log("提取的头像文件名:", avatarFileName);
    }

    // 处理封面图路径
    const coverImage = authStore.user?.coverImage;
    let coverFileName = "";
    if (coverImage) {
      const coverMatches = coverImage.match(/cover-[\w-]+\.\w+$/);
      coverFileName = coverMatches ? coverMatches[0] : "";
      console.log("提取的封面图文件名:", coverFileName);
    }
    
    // 初始化表单数据
    form.value = {
      username: authStore.user?.username || "",
      bio: authStore.user?.bio || "",
      email: authStore.user?.email || "",
      avatar: avatarFileName,
      coverImage: coverFileName,
    };
    
    console.log("表单数据初始化完成:", {
      formData: form.value,
      avatarUrl: displayAvatar.value,
      coverUrl: displayCover.value,
      originalUser: authStore.user
    });
  } catch (error) {
    console.error("初始化用户资料失败:", error);
    ElMessage.error("获取用户信息失败，请稍后重试");
  }
});

const saveProfile = async () => {
  try {
    saving.value = true;
    
    console.log("准备保存的表单数据:", form.value);
    
    // 验证必填字段
    if (!form.value.username.trim()) {
      ElMessage.error("用户名不能为空");
      return;
    }
    
    // 构建要发送的数据
    const profileData = {
      username: form.value.username.trim(),
      bio: form.value.bio || "",  // 确保bio不为null或undefined
      email: form.value.email,
      avatar: form.value.avatar,  // 只发送文件名
      coverImage: form.value.coverImage,  // 只发送文件名
    };
    
    console.log("发送的用户资料数据:", profileData);
    
    // 更新用户资料
    const response = await authStore.updateProfile(profileData);
    console.log("更新资料成功:", response);
    
    // 确保获取最新的用户信息
    await authStore.fetchUserInfo();
    
    ElMessage.success("个人资料保存成功");
    router.back();
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error(error.message || "保存失败，请稍后重试");
  } finally {
    saving.value = false;
  }
};

const beforeUpload = (file, type = 'image') => {
  console.log(`验证${type}上传:`, file);
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  
  // 根据类型确定大小限制
  const sizeLimit = type === 'cover' ? 5 : 2; // 封面图5MB，头像2MB
  const isUnderSizeLimit = file.size / 1024 / 1024 < sizeLimit;

  if (!isJpgOrPng) {
    ElMessage.error("图片只能是 JPG 或 PNG 格式!");
  }
  if (!isUnderSizeLimit) {
    ElMessage.error(`图片大小不能超过 ${sizeLimit}MB!`);
  }
  return isJpgOrPng && isUnderSizeLimit;
};

const handleCoverSuccess = (res) => {
  try {
    console.log("封面图上传成功，返回数据:", res);
    if (res.url) {
      // 从完整 URL 中提取文件名
      const matches = res.url.match(/cover-[\w-]+\.\w+$/);
      console.log("提取封面图文件名:", matches);
      if (matches) {
        form.value.coverImage = matches[0]; // 只保存文件名
        console.log("更新表单中的封面图文件名:", form.value.coverImage);
        ElMessage.success("封面图上传成功");
      } else {
        ElMessage.error("上传失败：无效的文件名格式");
      }
    } else {
      ElMessage.error("上传失败：返回数据格式错误");
    }
  } catch (error) {
    console.error("处理封面图上传响应失败:", error);
    ElMessage.error("处理上传响应失败");
  }
};

const handleAvatarSuccess = (res) => {
  try {
    console.log("头像上传成功，返回数据:", res);
    if (res.url) {
      // 从完整 URL 中提取文件名
      const matches = res.url.match(/avatar-[\w-]+\.\w+$/);
      console.log("提取头像文件名:", matches);
      if (matches) {
        form.value.avatar = matches[0]; // 只保存文件名
        console.log("更新表单中的头像文件名:", form.value.avatar);
        ElMessage.success("头像上传成功");
      } else {
        ElMessage.error("上传失败：无效的文件名格式");
      }
    } else {
      ElMessage.error("上传失败：返回数据格式错误");
    }
  } catch (error) {
    console.error("处理头像上传响应失败:", error);
    ElMessage.error("处理上传响应失败");
  }
};

const handleUploadError = (error) => {
  console.error("上传失败:", error);
  ElMessage.error("上传失败，请检查网络连接或服务器状态");
};

const displayAvatar = computed(() => {
  if (!form.value.avatar) return "";
  console.log("计算头像URL:", {
    原始值: form.value.avatar,
    处理后: getAvatarUrl(form.value.avatar)
  });
  return getAvatarUrl(form.value.avatar);
});

const displayCover = computed(() => {
  if (!form.value.coverImage) return defaultCover;
  console.log("计算封面URL:", {
    原始值: form.value.coverImage,
    处理后: getImageUrl(form.value.coverImage)
  });
  return getImageUrl(form.value.coverImage);
});
</script>

<style scoped>
/* 清新优雅风格全局变量 */
:root {
  --primary-color: #4e95ff;
  --secondary-color: #85c9e8;
  --accent-color: #9dd0ff;
  --bg-color: #f8f9fc;
  --card-bg: #ffffff;
  --text-color: #333333;
  --text-light: #666666;
  --border-color: #e8e8e8;
  --hover-color: #f0f5ff;
}

/* 页面容器 */
.edit-profile-page {
  min-height: 100vh;
  background-color: #f8f9fc;
  color: #333333;
  padding-bottom: 40px;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background-color: #ffffff;
  position: relative;
  border-bottom: 1px solid #eaeaea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  color: #333333;
  cursor: pointer;
}

.page-header h2 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333333;
}

.save-btn {
  background-color: #4e95ff;
  color: #ffffff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-btn:hover {
  background-color: #3a85f0;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 封面图片 */
.cover-image-wrapper {
  position: relative;
  width: 100%;
  height: 170px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1);
}

.cover-update-btn {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333333;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;
}

.cover-update-btn:hover {
  background-color: #ffffff;
}

/* 头像部分 */
.avatar-container {
  display: flex;
  justify-content: center;
  margin-top: -40px;
  margin-bottom: 24px;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.el-avatar) {
  border: 3px solid #ffffff;
  background: #f0f0f0;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar-update-label {
  color: #4e95ff;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
}

.avatar-update-label:hover {
  color: #3a85f0;
}

/* 表单样式 */
.form-container {
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.profile-form {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-form-item__label) {
  color: #333333;
  font-size: 15px;
  padding-bottom: 4px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  background-color: #f9f9f9;
  box-shadow: none;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover) {
  border-color: #c0d7ff;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: #333333;
}

:deep(.el-input__count) {
  background: transparent;
  color: #999999;
}

/* 确保边框正确显示 */
:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__wrapper:focus-within) {
  box-shadow: 0 0 0 1px #4e95ff inset;
  border-color: #4e95ff;
}

/* 修复表单样式在浅色模式下的问题 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}
</style>
