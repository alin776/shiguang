<template>
  <div class="login-container">
    <!-- 简约风格背景 -->
    <div class="background-elements">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <div class="login-content">
      <div class="login-header">
        <img src="../assets/logo.png" alt="时光" class="logo" />
        <h1 class="login-title">时光</h1>
        <p class="login-subtitle">记录美好，分享生活</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        class="login-form focus-glow"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="邮箱/手机号"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="login-options">
            <div class="left-option">
              <el-checkbox v-model="loginForm.autoLogin">记住我</el-checkbox>
            </div>
            <div class="right-option">
              <el-link type="primary" @click="forgotPassword"
                >忘记密码？</el-link
              >
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <div class="button-container">
            <el-button
              class="login-button glow-button pulse-on-click"
              @click="handleLogin"
              :loading="loading"
              round
            >
              登录
            </el-button>
          </div>
        </el-form-item>

        <div class="register-link">
          <span>还没有账号？</span>
          <el-link type="primary" @click="goToRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Lock, User } from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const loginFormRef = ref(null);
const loading = ref(false);
const authStore = useAuthStore();
const tokenExpired = ref(false);

const loginForm = reactive({
  username: "",
  password: "",
  autoLogin: false,
});

// 检查URL参数，如果是因为token过期重定向过来的，显示提示信息
onMounted(() => {
  if (route.query.expired === "true") {
    tokenExpired.value = true;
    ElMessage.warning("登录已过期，请重新登录");
  }
});

const rules = {
  username: [
    { required: true, message: "请输入用户名/邮箱/手机号", trigger: "blur" },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;

    const response = await authStore.loginUser(loginForm);
    console.log("用户头像URL:", response.user.avatar); // 打印头像URL

    // 保存登录状态
    if (loginForm.autoLogin) {
      localStorage.setItem("token", authStore.token);
      localStorage.setItem("user", JSON.stringify(authStore.user));
      localStorage.setItem("autoLogin", "true");
    } else {
      // 即使未选择"记住我"，也应保存登录状态
      localStorage.setItem("token", authStore.token);
      localStorage.setItem("user", JSON.stringify(authStore.user));
      localStorage.removeItem("autoLogin"); // 清除自动登录标记
    }

    // 确保 authStore.user 包含正确的用户信息
    authStore.user = response.user;

    // 统一使用路由跳转
    router.replace("/calendar");
  } catch (error) {
    ElMessage.error(error.message || "登录失败");
  } finally {
    loading.value = false;
  }
};

const forgotPassword = () => {
  router.push("/forgot-password");
};

const goToRegister = () => {
  router.push("/register");
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #e0f7fa, #bbdefb);
  background-size: cover;
  overflow: hidden;
  position: relative;
}

.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 30px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-content:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-title {
  font-size: 32px;
  color: var(--primary-color);
  font-weight: 700;
  margin-top: 12px;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8);
}

.login-subtitle {
  font-size: 16px;
  color: var(--text-color-light);
  margin-top: 8px;
}

.login-button {
  height: 44px;
  font-size: 16px;
  width: 80%;
  max-width: 300px;
  background: linear-gradient(135deg, var(--primary-color), #2980b9);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  transition: all 0.3s ease;
  color: white;
  border-radius: 8px;
}

.glow-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(74, 144, 226, 0.5);
}

.glow-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(74, 144, 226, 0.3);
}

.register-link {
  text-align: center;
  margin-top: 24px;
}

.register-link span {
  color: var(--text-color-light);
  margin-right: 8px;
}

/* 输入框样式调整 - 提高优先级 */
:deep(.el-form .el-input .el-input__wrapper) {
  background-color: white !important;
  border: 1px solid rgba(74, 144, 226, 0.2) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
  border-radius: 8px !important;
  height: 44px;
  transition: all 0.3s ease;
}

:deep(.el-input .el-input__inner) {
  color: #333333 !important;
  background-color: white !important;
  font-weight: 500 !important;
  font-size: 15px !important;
}

:deep(.el-form .el-input .el-input__wrapper:hover) {
  border-color: rgba(74, 144, 226, 0.5) !important;
  background-color: white !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08) !important;
}

:deep(.el-form .el-input .el-input__wrapper:focus-within) {
  border-color: var(--primary-color) !important;
  background-color: white !important;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2) !important;
}

/* 图标颜色 */
:deep(.el-input__prefix-inner svg) {
  color: var(--primary-color);
}

/* 表单标签样式 */
:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 15px;
  color: #333333 !important;
  font-weight: 600;
}

/* 复选框样式 */
:deep(.el-checkbox__inner) {
  background-color: white !important;
  border-color: var(--primary-color) !important;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--primary-color) !important;
}

:deep(.el-checkbox__label) {
  color: var(--text-color) !important;
}

/* 链接颜色 */
:deep(.el-link) {
  color: var(--primary-color) !important;
}

:deep(.el-link:hover) {
  color: var(--accent-color) !important;
}

.background-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.8;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #4A90E2, #56CCF2);
  top: -100px;
  right: -50px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #F5A623, #F8E71C);
  bottom: -50px;
  left: -60px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #4CD964, #B8E986);
  top: 60%;
  right: 10%;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 12px;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 10px;
}

/* 错误提示样式 */
:deep(.el-form-item__error) {
  color: var(--danger-color);
  font-size: 12px;
  margin-top: 4px;
}

/* 输入框验证失败状态 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: var(--danger-color) !important;
  box-shadow: 0 0 0 1px rgba(255, 59, 48, 0.1) !important;
}

.login-form {
  width: 100%;
  margin-top: 10px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.left-option {
  flex: 1;
}

.right-option {
  text-align: right;
}

/* 按钮容器 */
.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}
</style>
