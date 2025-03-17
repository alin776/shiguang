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

      <!-- 应用信息组 -->
      <div class="settings-group tech-card enhanced-border">
        <div class="group-title">应用信息</div>
        <div class="settings-item link" @click="goToFeedback">
          <span>问题反馈</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item link" @click="showContactDialog">
          <span>联系我们</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item link" @click="goToVersionHistory">
          <span>版本历史</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="settings-item link" @click="checkForUpdates">
          <span>检查更新</span>
          <div class="version-info">
            <span class="version-text">{{ updateStore.currentVersion }}</span>
            <el-tag v-if="isCheckingUpdate" size="small" type="info">检查中...</el-tag>
            <el-tag v-else-if="updateStore.updateAvailable" size="small" type="success">发现新版本</el-tag>
          </div>
        </div>
        <div class="settings-item link" @click="showAbout">
          <span>关于我们</span>
          <el-icon><ArrowRight /></el-icon>
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
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSettingsStore } from "../stores/settings";
import { API_BASE_URL } from "../config";
import { getAvatarUrl } from "../utils/imageHelpers";
import { ArrowLeft, ArrowRight, Setting } from "@element-plus/icons-vue";
import { useClipboard } from "@vueuse/core";
import { useUpdateStore } from "../stores/updateStore";

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const updateStore = useUpdateStore();
const router = useRouter();
const avatarInput = ref(null);
const showContact = ref(false);
const loading = ref(false);
const cacheSize = ref("12.5MB");
const isCheckingUpdate = ref(false);

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

const { copy } = useClipboard();

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

const goToVersionHistory = () => {
  router.push("/version-history");
};

const checkForUpdates = async () => {
  try {
    isCheckingUpdate.value = true;
    const hasUpdate = await updateStore.checkForUpdates(true);
    
    if (hasUpdate) {
      ElMessage.success("发现新版本，请前往更新");
    } else {
      ElMessage.info("当前已是最新版本");
    }
  } catch (error) {
    ElMessage.error("检查更新失败，请稍后重试");
    console.error("检查更新失败:", error);
  } finally {
    isCheckingUpdate.value = false;
  }
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
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 100;
}

.back-icon {
  font-size: 20px;
  margin-right: 12px;
  cursor: pointer;
  color: #333;
}

.settings-header h2 {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.settings-list {
  padding: 12px;
}

.settings-group {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.group-title {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  background-color: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
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

.version-info {
  display: flex;
  align-items: center;
  gap: 8px;
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
