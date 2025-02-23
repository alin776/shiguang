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
      <div class="settings-group">
        <div class="group-title">个人资料</div>
        <div class="settings-item avatar-item">
          <span>头像</span>
          <div class="avatar-wrapper">
            <el-avatar
              :size="60"
              :src="userAvatar"
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
      <div class="settings-group">
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
      <div class="settings-group">
        <div class="group-title">主题设置</div>
        <div class="settings-item">
          <span>深色模式</span>
          <el-switch
            v-model="isDarkMode"
            @change="handleThemeChange"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </div>

      <!-- 反馈与帮助 -->
      <div class="settings-group">
        <div class="group-title">反馈与帮助</div>
        <div class="settings-item link" @click="goToFeedback">
          <span>问题反馈</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item link" @click="showContactDialog">
          <span>联系我们</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item">
          <span>当前版本</span>
          <span class="version-text">1.0.0</span>
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
import { useSettingsStore } from "../stores/settings";
import { useAuthStore } from "../stores/auth";
import { useFeedbackStore } from "../stores/feedback";
import { useClipboard } from "@vueuse/core";
import axios from "axios";

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

// 主题设置
const isDarkMode = ref(authStore.theme === "dark");

const handleThemeChange = async (value) => {
  const newTheme = value ? "dark" : "light";
  try {
    await settingsStore.updateSettings({
      theme: {
        darkMode: value,
        color: "#409EFF",
      },
    });
    authStore.setTheme(newTheme);
  } catch (error) {
    ElMessage.error("保存设置失败");
  }
};

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
    isDarkMode.value = authStore.theme === "dark";
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
    ElMessage.success("缓存已清除");
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
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
  overflow: scroll;
}

.settings-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.settings-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.back-icon {
  font-size: 20px;
  color: #606266;
  cursor: pointer;
  padding: 4px;
}

.settings-list {
  padding: 16px;
}

.settings-group {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.group-title {
  padding: 12px 16px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item span {
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.settings-item.link {
  cursor: pointer;
}

.settings-item.link:active {
  background: #f5f7fa;
}

.el-select {
  width: 100px;
}

/* 移动端优化 */
@media screen and (max-width: 768px) {
  .settings-list {
    padding: 12px;
  }

  .settings-item {
    padding: 14px;
  }

  .settings-item span {
    font-size: 14px;
  }

  .group-title {
    font-size: 13px;
    padding: 10px 14px;
  }
}

.settings-section {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.section-content {
  color: var(--el-text-color-regular);
}

/* 深色模式开关优化 */
:deep(.el-switch__label) {
  color: var(--el-text-color-regular) !important;
}

:deep(.el-switch__label.is-active) {
  color: var(--el-color-primary) !important;
}

:deep(.el-switch__core) {
  border-color: var(--el-border-color-light) !important;
}

.version-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
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
  border-bottom: 1px solid var(--el-border-color-light);
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-label {
  font-size: 15px;
  color: var(--el-text-color-regular);
  width: 80px;
}

.contact-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  color: var(--el-text-color-primary);
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
  transition: transform 0.3s;
  border: 2px solid transparent;
}

:deep(.el-avatar:hover) {
  transform: scale(1.05);
  border-color: var(--el-color-primary);
}
</style>
