<template>
  <div class="login-container page-container">
    <!-- 添加宇宙粒子背景 -->
    <SpaceBackground />

    <div class="login-header cosmic-header">
      <img src="../assets/logo.png" alt="Logo" class="logo" />
      <h1 class="app-title cosmic-text">时光日历</h1>
      <p>记录每一刻美好时光</p>
    </div>

    <div class="login-form tech-card enhanced-border">
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
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
          <el-button
            class="login-button glow-button"
            @click="handleLogin"
            :loading="loading"
            round
            block
          >
            登录
          </el-button>
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
import SpaceBackground from "./calendar/components/SpaceBackground.vue";

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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(18, 18, 30, 0.9);
  color: white;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.cosmic-header {
  position: relative;
  z-index: 2;
}

.app-title {
  font-size: 36px;
  margin: 16px 0 8px;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.8);
  letter-spacing: 2px;
}

.cosmic-text {
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.4);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 8px rgba(147, 51, 234, 0.6));
  background-color: aliceblue;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.5);
}

.login-header h1 {
  font-size: 28px;
  margin: 0 0 8px;
}

.login-header p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.login-form {
  width: 100%;
  max-width: 400px;
  background: rgba(30, 30, 40, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(147, 51, 234, 0.2);
  padding: 30px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.enhanced-border {
  position: relative;
  z-index: 0;
}

.enhanced-border::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  padding: 2px;
  border-radius: 16px;
  background: linear-gradient(
    45deg,
    rgba(56, 189, 248, 0.6),
    rgba(147, 51, 234, 0.6)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  align-items: center;
}

.left-option {
  flex: 1;
}

.right-option {
  text-align: right;
}

.login-button {
  height: 44px;
  font-size: 16px;
  margin-top: 20px;
  background: linear-gradient(45deg, #8b5cf6, #d946ef);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4);
  transition: all 0.3s ease;
  color: white;
}

.glow-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(147, 51, 234, 0.6);
}

.glow-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(147, 51, 234, 0.4);
}

.register-link {
  text-align: center;
  margin-top: 24px;
}

.register-link span {
  color: rgba(255, 255, 255, 0.7);
  margin-right: 8px;
}

/* 输入框样式调整 */
:deep(.el-input__wrapper) {
  background-color: rgba(30, 30, 40, 0.6) !important;
  border: 1px solid rgba(147, 51, 234, 0.3) !important;
  box-shadow: none !important;
  border-radius: 8px !important;
  height: 44px;
}

:deep(.el-input__inner) {
  color: white !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(147, 51, 234, 0.7) !important;
  background-color: rgba(147, 51, 234, 0.05) !important;
  box-shadow: 0 0 8px rgba(147, 51, 234, 0.3) !important;
}

:deep(.el-input__wrapper:focus-within) {
  border-color: rgba(147, 51, 234, 0.9) !important;
  background-color: rgba(147, 51, 234, 0.1) !important;
  box-shadow: 0 0 12px rgba(147, 51, 234, 0.5) !important;
}

/* 图标颜色 */
:deep(.el-input__prefix-inner svg) {
  color: rgba(147, 51, 234, 0.8);
  filter: drop-shadow(0 0 2px rgba(147, 51, 234, 0.4));
}

/* 复选框样式 */
:deep(.el-checkbox__inner) {
  background-color: rgba(30, 30, 40, 0.6) !important;
  border-color: rgba(147, 51, 234, 0.5) !important;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: rgba(147, 51, 234, 0.8) !important;
}

:deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* 链接颜色 */
:deep(.el-link) {
  color: rgba(147, 51, 234, 0.9) !important;
}

:deep(.el-link:hover) {
  color: rgba(147, 51, 234, 1) !important;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.6);
}
</style>
