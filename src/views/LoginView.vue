<template>
  <div class="login-container">
    <div class="login-header">
      <img src="../assets/logo.png" alt="Logo" class="logo" />
      <h1>时光日历</h1>
      <p>记录每一刻美好时光</p>
    </div>

    <div class="login-form">
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
            type="primary"
            @click="handleLogin"
            :loading="loading"
            class="login-button"
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
import { useAuthStore } from "../stores/auth";
import { User, Lock } from "@element-plus/icons-vue";

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
  if (route.query.expired === 'true') {
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
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-7) 0%,
    var(--el-color-primary-light-9) 100%
  );
  padding: 40px 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  color: var(--el-color-primary);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 28px;
  margin: 0 0 8px;
}

.login-header p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.login-form {
  width: 100%;
  max-width: 400px;
  background-color: var(--el-bg-color-overlay);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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
}

.register-link {
  text-align: center;
  margin-top: 24px;
}

.register-link span {
  color: var(--el-text-color-secondary);
  margin-right: 8px;
}

/* 深色模式适配 */
:deep(.el-input__wrapper) {
  background-color: var(--el-bg-color);
  height: 44px;
}

:deep(.el-input__inner) {
  color: var(--el-text-color-primary);
}
</style>
