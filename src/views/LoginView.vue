<template>
  <div class="login-container">
    <!-- 顶部装饰 -->
    <div class="top-decoration"></div>
    
    <!-- 中央白色圆形 -->
    <div class="circle-container">
      <div class="white-circle">
        <img src="../assets/logo.png" alt="时光" class="logo-image" />
      </div>
    </div>
    
    <div class="login-content">
      <!-- 标题 -->
      <div class="app-branding">
        <h1 class="app-title">时光</h1>
        <p class="app-subtitle">记录美好，分享生活</p>
      </div>

      <!-- 登录表单 -->
      <div class="login-form-container">
        <div class="input-container username-container">
          <div class="input-icon">
            <el-icon><User /></el-icon>
          </div>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入手机号"
            class="login-input"
          />
        </div>

        <div class="input-container password-container">
          <div class="input-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            class="login-input"
            show-password
          />
        </div>

        <div class="remember-forgot">
          <div class="remember-option">
            <el-checkbox v-model="loginForm.autoLogin">记住我的密码?</el-checkbox>
          </div>
          <span class="forgot-link" @click="forgotPassword">忘记密码?</span>
        </div>

        <el-button class="login-btn" @click="handleLogin" :loading="loading">
          登录
        </el-button>

        <div class="register-prompt">
          还没有账号? <span class="register-link" @click="goToRegister">立即注册</span>
        </div>
      </div>
    </div>
    
    <!-- 底部装饰 -->
    <div class="bottom-decoration"></div>
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
  try {
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
    router.replace("/note");
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
  justify-content: space-between;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* 顶部装饰 */
.top-decoration {
  height: 15vh;
  max-height: 120px;
  min-height: 70px;
  background: linear-gradient(to right, #c9e1ff, #4a90e2);
  border-bottom-left-radius: 100px;
  border-bottom-right-radius: 100px;
  position: relative;
}

/* 底部装饰 */
.bottom-decoration {
  height: 8vh;
  max-height: 80px;
  min-height: 50px;
  background: linear-gradient(to right, #f6d365, #c9e1ff);
  border-top-left-radius: 50px;
  border-top-right-radius: 50px;
}

/* 中央白色圆形 */
.circle-container {
  position: absolute;
  top: 15vh;
  max-top: 120px;
  min-top: 70px;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.white-circle {
  width: 100px;
  height: 100px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 400px;
  padding: 0 20px;
  margin: 0 auto;
  flex: 1;
  padding-top: 50px;
}

/* 应用标题样式 */
.app-branding {
  text-align: center;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.app-title {
  color: #4a90e2;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
}

.app-subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin-top: 0.5rem;
}

/* 表单容器 */
.login-form-container {
  width: 100%;
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 输入框样式 */
.input-container {
  margin-bottom: 1.5rem;
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 2;
}

:deep(.login-input .el-input__wrapper) {
  padding-left: 2.5rem;
  border-radius: 0.375rem;
  background-color: #f2f7ff;
  box-shadow: none;
  border: 1px solid #e5e7eb;
  height: 3.5rem;
}

:deep(.el-input__suffix) {
  right: 0.75rem;
}

/* 记住密码和忘记密码行 */
.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-option {
  display: flex;
  align-items: center;
}

.forgot-link {
  color: #4a90e2;
  cursor: pointer;
  font-size: 0.875rem;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 3.5rem;
  background-color: #222;
  color: white;
  font-size: 1rem;
  border: none;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.login-btn:hover {
  background-color: #000;
}

/* 注册提示 */
.register-prompt {
  text-align: center;
  color: #6b7280;
  margin-top: 1.5rem;
  font-size: 0.875rem;
}

.register-link {
  color: #4a90e2;
  cursor: pointer;
  font-weight: 500;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .login-content {
    padding-top: 70px;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .white-circle {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .login-content {
    padding: 0 16px;
    padding-top: 60px;
  }
  
  .login-form-container {
    padding: 1.25rem;
  }
  
  .app-title {
    font-size: 1.75rem;
  }
  
  .white-circle {
    width: 90px;
    height: 90px;
  }
}
</style>
