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
          :action="`${API_BASE_URL}/api/users/upload/cover`"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleCoverSuccess"
          :before-upload="beforeUpload"
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
          :before-upload="beforeUpload"
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

const saving = ref(false);
const form = ref({
  username: "",
  bio: "",
  email: "",
  avatar: "",
  coverImage: "",
});

onMounted(async () => {
  const avatar = authStore.user?.avatar;
  const avatarMatches = avatar?.match(/avatar-[\w-]+\.\w+$/);

  const coverImage = authStore.user?.coverImage;
  const coverMatches = coverImage?.match(/cover-[\w-]+\.\w+$/);

  form.value = {
    username: authStore.user?.username || "",
    bio: authStore.user?.bio || "",
    email: authStore.user?.email || "",
    avatar: avatarMatches ? avatarMatches[0] : "", // 只保存头像文件名
    coverImage: coverMatches ? coverMatches[0] : "", // 只保存封面图文件名
  };
});

const saveProfile = async () => {
  try {
    saving.value = true;
    const profileData = {
      username: form.value.username,
      bio: form.value.bio,
      email: form.value.email,
      avatar: form.value.avatar,
      coverImage: form.value.coverImage,
    };

    const response = await authStore.updateProfile(profileData);
    ElMessage.success("保存成功");
    router.back();
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error(error.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

const beforeCoverUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isJpgOrPng) {
    ElMessage.error("封面图只能是 JPG 或 PNG 格式!");
  }
  if (!isLt5M) {
    ElMessage.error("封面图大小不能超过 5MB!");
  }
  return isJpgOrPng && isLt5M;
};

const handleCoverSuccess = (res) => {
  try {
    if (res.url) {
      // 从完整 URL 中提取文件名
      const matches = res.url.match(/cover-[\w-]+\.\w+$/);
      if (matches) {
        form.value.coverImage = matches[0]; // 只保存文件名
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
    if (res.url) {
      // 从完整 URL 中提取文件名
      const matches = res.url.match(/avatar-[\w-]+\.\w+$/);
      if (matches) {
        form.value.avatar = matches[0]; // 只保存文件名
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
  ElMessage.error("上传失败，请重试");
};

const beforeAvatarUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJpgOrPng) {
    ElMessage.error("头像只能是 JPG 或 PNG 格式!");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("头像大小不能超过 2MB!");
    return false;
  }
  return true;
};

const displayAvatar = computed(() => {
  if (!form.value.avatar) return "";
  return getAvatarUrl(form.value.avatar);
});

const displayCover = computed(() => {
  if (!form.value.coverImage) return defaultCover;
  return getImageUrl(form.value.coverImage);
});
</script>

<style scoped>
/* 太空科技风格全局变量 */
:root {
  --primary-color: #8c52ff;
  --secondary-color: #ff52aa;
  --accent-color: #36f9f6;
  --bg-color: #121212;
  --card-bg: rgba(30, 30, 30, 0.8);
  --text-color: #ffffff;
  --border-color: #333333;
  --hover-color: #373737;
}

/* 页面容器 */
.edit-profile-page {
  min-height: 100vh;
  background-color: #1a1a1a;
  color: #ffffff;
  padding-bottom: 40px;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background-color: #1a1a1a;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-icon {
  font-size: 20px;
  color: #ffffff;
  cursor: pointer;
}

.page-header h2 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
}

.save-btn {
  background-color: #4080ff;
  color: #ffffff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
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
  background-color: rgba(0, 0, 0, 0.3);
}

.cover-update-btn {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
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
  border: 3px solid #1a1a1a;
  background: #333;
  margin-bottom: 8px;
}

.avatar-update-label {
  color: #4080ff;
  font-size: 14px;
  cursor: pointer;
}

/* 表单样式 */
.form-container {
  padding: 0 16px;
}

.profile-form {
  background-color: #1a1a1a;
}

:deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  padding-bottom: 4px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  background-color: #2a2a2a;
  box-shadow: none;
  border-radius: 8px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: #ffffff;
}

:deep(.el-input__count) {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
}

/* 确保渐变边框正确显示 */
:deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 1px #4080ff inset;
}

/* 修复表单样式在暗色模式下的问题 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}
</style>
