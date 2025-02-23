<template>
  <div class="edit-profile-page">
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>编辑资料</h2>
      <el-button
        class="save-btn"
        type="primary"
        :loading="saving"
        @click="saveProfile"
        >保存</el-button
      >
    </div>

    <div class="edit-form">
      <!-- 添加背景图部分 -->
      <div class="cover-section">
        <div class="cover-wrapper">
          <div
            class="cover-preview"
            :style="{
              backgroundImage: `url(${displayCover})`,
            }"
          >
            <el-upload
              class="cover-uploader"
              :action="`${API_BASE_URL}/api/upload/cover`"
              :headers="{ Authorization: `Bearer ${authStore.token}` }"
              :show-file-list="false"
              :on-success="handleCoverSuccess"
              :before-upload="beforeCoverUpload"
            >
              <div class="upload-cover-label">
                <el-icon><Camera /></el-icon>
                <span>更换背景</span>
              </div>
            </el-upload>
          </div>
        </div>
      </div>

      <!-- 在 cover-section 后添加头像部分 -->
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <el-avatar :size="80" :src="displayAvatar" @error="() => true">
            {{ form.username?.charAt(0).toUpperCase() || "?" }}
          </el-avatar>
          <div class="avatar-upload">
            <el-upload
              class="avatar-uploader"
              :action="`${API_BASE_URL}/api/users/upload/avatar`"
              :headers="{ Authorization: `Bearer ${authStore.token}` }"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              :on-error="handleUploadError"
              name="file"
            >
              <div class="upload-label">
                <el-icon><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </el-upload>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>用户名</label>
        <el-input
          v-model="form.username"
          placeholder="请输入用户名"
          maxlength="20"
          show-word-limit
        />
      </div>

      <div class="form-group">
        <label>个性签名</label>
        <el-input
          v-model="form.bio"
          type="textarea"
          placeholder="介绍一下自己吧"
          maxlength="200"
          show-word-limit
          :rows="4"
        />
      </div>

      <div class="form-group">
        <label>邮箱</label>
        <el-input
          v-model="form.email"
          placeholder="请输入邮箱"
          type="email"
          disabled
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { ElMessage } from "element-plus";
import { ArrowLeft, Camera } from "@element-plus/icons-vue";

const router = useRouter();
const authStore = useAuthStore();
const API_BASE_URL = "http://47.98.210.7:3000";
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
  return form.value.avatar.startsWith("http")
    ? form.value.avatar
    : `${API_BASE_URL}/uploads/avatars/${form.value.avatar}`;
});

const displayCover = computed(() => {
  if (!form.value.coverImage) return defaultCover;
  return form.value.coverImage.startsWith("http")
    ? form.value.coverImage
    : `${API_BASE_URL}/uploads/covers/${form.value.coverImage}`;
});
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background: #f6f7f9;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  color: #333;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
}

.page-header h2 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.save-btn {
  font-size: 14px;
  height: 32px;
  padding: 0 16px;
}

.edit-form {
  padding: 20px 16px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-textarea__wrapper) {
  border-radius: 8px;
}

@media (prefers-color-scheme: dark) {
  .edit-profile-page {
    background: #1a1a1a;
  }

  .page-header {
    background: #242424;
  }

  .page-header h2 {
    color: #fff;
  }

  .back-icon {
    color: #fff;
  }

  .form-group label {
    color: #909399;
  }
}

.cover-section {
  margin-bottom: 24px;
}

.cover-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f7fa;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-preview::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s;
}

.cover-preview:hover::before {
  opacity: 1;
}

.upload-cover-label {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 2;
}

.upload-cover-label:hover {
  background: rgba(0, 0, 0, 0.8);
}

.upload-cover-label .el-icon {
  font-size: 16px;
}

.upload-cover-label span {
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  .cover-wrapper {
    background: #242424;
  }

  .upload-cover-label {
    background: rgba(36, 36, 36, 0.9);
    color: #fff;
  }
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.avatar-wrapper {
  text-align: center;
}

.avatar-upload {
  margin-top: 12px;
}

.upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
}

@media (prefers-color-scheme: dark) {
  .avatar-wrapper {
    background: #242424;
  }

  .upload-label {
    background: rgba(36, 36, 36, 0.9);
    color: #fff;
  }
}
</style>
