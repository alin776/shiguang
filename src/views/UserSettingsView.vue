<template>
  <div class="settings-page">
    <!-- 顶部标题 -->
    <div class="settings-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>设置</h2>
    </div>

    <!-- 设置选项列表 -->
    <div class="settings-list">
      <!-- 个人资料设置组 -->
      <div class="settings-group tech-card enhanced-border">
        <div class="group-title">个人资料</div>
        <div class="settings-item avatar-item">
          <span>头像</span>
          <div class="avatar-wrapper">
            <el-avatar
              :size="60"
              :src="getAvatarUrl(userAvatar)"
              @error="() => true"
              @click="triggerAvatarUpload"
            >
              {{ userInitials }}
            </el-avatar>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
          </div>
        </div>
      </div>

      <!-- 账号设置组 -->
      <div class="settings-group tech-card enhanced-border">
        <div class="group-title">账号设置</div>
        <div class="settings-item link" @click="changePassword">
          <span>修改密码</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item">
          <span>自动登录</span>
          <el-switch v-model="settings.account.autoLogin" />
        </div>
      </div>

      <!-- 主题设置组 -->
      <div class="settings-group tech-card enhanced-border">
        <div class="group-title">主题设置</div>
        <div class="settings-item">
          <span>界面主题</span>
          <span class="theme-info">简约清新风格</span>
        </div>
      </div>

      <!-- 反馈与帮助 -->
      <div class="settings-group tech-card enhanced-border">
        <div class="group-title">反馈与帮助</div>
        <div class="settings-item link" @click="goToFeedback">
          <span>问题反馈</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item link" @click="showContactDialog">
          <span>联系我们</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item link" @click="showAbout">
          <span>关于我们</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item">
          <span>当前版本</span>
          <span class="version-text">1.0.0</span>
        </div>
      </div>

      <!-- 账号操作 -->
      <div class="settings-group tech-card enhanced-border">
        <div class="settings-item logout" @click="handleLogout">
          <span>退出登录</span>
        </div>
      </div>
    </div>

    <!-- 联系我们对话框 -->
    <el-dialog
      v-model="showContact"
      title="联系我们"
      width="90%"
      class="mobile-dialog"
    >
      <div class="contact-list">
        <div class="contact-item">
          <div class="contact-label">QQ群</div>
          <div class="contact-value">
            <span>123456789</span>
            <el-button type="primary" link @click="copyText('123456789')">
              复制
            </el-button>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-label">QQ邮箱</div>
          <div class="contact-value">
            <span>3358696583@qq.com</span>
            <el-button type="primary" link @click="copyText('example@qq.com')">
              复制
            </el-button>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-label">官方网站</div>
          <div class="contact-value">
            <span>www.example.com</span>
            <el-button type="primary" link @click="copyText('www.example.com')">
              复制
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { useSettingsStore } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import { useClipboard } from "@vueuse/core";
import axios from "axios";
import { getAvatarUrl } from "@/utils/imageHelpers";

const router = useRouter();
const route = useRoute();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();
const loading = ref(false);
const cacheSize = ref("0.0MB");
const showContact = ref(false);
const { copy } = useClipboard();
const avatarInput = ref(null);
const API_BASE_URL = "http://47.98.210.7:3000";

const settings = reactive({
  account: {
    autoLogin: true,
  },
});

// 用户头像计算属性
const userAvatar = computed(() => authStore.userAvatar);

const userInitials = computed(() => {
  const username = authStore.user?.username || "";
  return username.charAt(0).toUpperCase();
});

const triggerAvatarUpload = () => {
  avatarInput.value.click();
};

const handleAvatarChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append("file", file);

    // 上传头像
    const response = await axios.post(
      `${API_BASE_URL}/api/users/upload/avatar`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("头像上传响应:", response.data); // 添加日志

    // 更新用户资料，确保所有必要字段都有值
    const profileData = {
      username: authStore.user.username,
      bio: authStore.user.bio || "",
      email: authStore.user.email,
      avatar: response.data.url.split("/").pop(), // 只保留文件名
      coverImage: authStore.user.coverImage
        ? authStore.user.coverImage.split("/").pop()
        : null,
    };

    console.log("发送的个人资料数据:", profileData); // 添加日志

    await authStore.updateProfile(profileData);
    ElMessage.success("头像更新成功");
  } catch (error) {
    console.error("更新头像失败:", error);
    ElMessage.error(error.response?.data?.message || "更新头像失败");
  }
};

onMounted(async () => {
  try {
    const userSettings = await settingsStore.fetchSettings();
    settings.account.autoLogin = userSettings.account?.autoLogin ?? true;
    console.log("设置页面用户头像URL:", authStore.user?.avatar);
  } catch (error) {
    ElMessage.error("加载设置失败");
  }
});

const changePassword = () => {
  router
    .push({
      name: "ChangePassword",
      query: { from: "settings" },
    })
    .catch((err) => {
      console.error("导航错误:", err);
      ElMessage.error("页面加载失败");
    });
};

const clearCache = async () => {
  try {
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟清理过程
    cacheSize.value = "0.0MB";
    ElMessage.success("缓存已清理");
  } catch (error) {
    ElMessage.error("清除缓存失败");
  } finally {
    loading.value = false;
  }
};

const calculateCacheSize = () => {
  cacheSize.value = "12.5MB";
};

const goToFeedback = () => {
  router.push("/feedback");
};

const showContactDialog = () => {
  showContact.value = true;
};

const copyText = async (text) => {
  try {
    await copy(text);
    ElMessage.success("复制成功");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

const showAbout = () => {
  router.push("/about");
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/login");
    ElMessage.success("退出登录成功");
  } catch (error) {
    ElMessage.error("退出登录失败");
  }
};
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 60px;
  position: relative;
  overflow-x: hidden;
  padding: 0;
  font-family: "PingFang SC", "Helvetica Neue", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  color: #333;
}

.settings-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.back-icon {
  font-size: 20px;
  color: #333;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  transition: all 0.3s ease;
  border-radius: 50%;
}

.back-icon:hover {
  transform: translateX(-3px);
  color: #6366f1;
  background-color: rgba(99, 102, 241, 0.08);
}

.settings-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  color: #333;
  text-align: center;
  letter-spacing: 0.5px;
}

.settings-list {
  padding: 0 16px 16px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-group {
  position: relative;
  z-index: 0;
  padding: 0;
  border-radius: 12px;
  margin-bottom: 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 边框效果 */
.tech-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tech-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.enhanced-border {
  position: relative;
  z-index: 0;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.group-title {
  font-size: 14px;
  color: #555;
  padding: 12px 16px;
  background: #f9fafb;
  font-weight: 600;
  letter-spacing: 0.3px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.settings-item:hover {
  background: #f9fafb;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item span {
  color: #333;
  font-size: 15px;
}

.settings-item.link {
  cursor: pointer;
}

.settings-item.logout {
  color: #f56c6c;
  justify-content: center;
  background: #fff;
  font-weight: 500;
  transition: all 0.3s ease;
}

.settings-item.logout:hover {
  background: #fef2f2;
  color: #e63946;
}

/* 创建一个轻微的光标hover效果 */
.settings-item.link:after {
  content: "";
  position: absolute;
  right: 16px;
  width: 8px;
  height: 8px;
  border-top: 2px solid #ddd;
  border-right: 2px solid #ddd;
  transform: rotate(45deg);
  transition: all 0.2s ease;
}

.settings-item.link:hover:after {
  border-color: #6366f1;
  transform: rotate(45deg) translateX(3px);
}

.el-select {
  width: 120px;
}

/* 移动端优化 */
@media screen and (max-width: 768px) {
  .settings-list {
    padding: 0 12px 12px;
  }

  .settings-item {
    padding: 14px 16px;
  }

  .settings-item span {
    font-size: 15px;
  }

  .group-title {
    font-size: 14px;
    padding: 12px 16px;
  }
}

.settings-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.section-content {
  color: #333;
}

.version-text {
  color: #909399;
  font-size: 14px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-textarea__inner) {
  min-height: 120px !important;
}

.contact-list {
  padding: 0 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-label {
  font-size: 15px;
  color: #333;
  width: 80px;
  font-weight: 500;
}

.contact-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  color: #333;
}

.avatar-item {
  cursor: pointer;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

:deep(.el-avatar) {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #f2f3f5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-avatar:hover) {
  transform: scale(1.05);
  border-color: #6366f1;
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.2);
}

/* 主题信息样式 */
.theme-info {
  color: #6366f1;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.theme-info:before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #6366f1;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid #ffffff;
  box-shadow: 0 0 4px rgba(99, 102, 241, 0.3);
}

/* 对话框样式 */
:deep(.el-dialog) {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__title) {
  color: #333;
  font-weight: 600;
  font-size: 18px;
}

:deep(.el-button) {
  transition: all 0.3s;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #6366f1 !important;
  border-color: #6366f1 !important;
}

:deep(.el-switch__core) {
  background-color: #e4e7ed !important;
  border-color: #e4e7ed !important;
}
</style>
