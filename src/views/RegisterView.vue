<template>
  <div class="register-container">
    <!-- 简约风格背景 -->
    <div class="background-elements">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <div class="register-content">
      <div class="register-header">
        <img src="../assets/logo.png" alt="时光" class="logo" />
        <h1 class="register-title">时光</h1>
        <p class="register-subtitle">创建新账号</p>
      </div>

      <el-form
        :model="registerForm"
        :rules="rules"
        ref="registerFormRef"
        label-position="top"
        class="register-form focus-glow"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            show-password
          />
          <div
            class="password-strength tech-badge"
            v-if="registerForm.password"
          >
            密码强度：
            <span :class="['strength-indicator', passwordStrengthClass]">{{
              passwordStrength
            }}</span>
          </div>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="button-container">
            <el-button
              class="register-button glow-button pulse-on-click"
              @click="handleRegister"
              :loading="loading"
              round
            >
              注册
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="login-link">
        <span>已有账号？</span>
        <el-link type="primary" @click="goToLogin">返回登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { ElMessage } from "element-plus";

const router = useRouter();
const authStore = useAuthStore();
const registerFormRef = ref(null);
const loading = ref(false);

const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
});

// 密码强度验证
const passwordStrength = computed(() => {
  const password = registerForm.password;
  if (!password) return "";

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "弱";
  if (score <= 4) return "中";
  return "强";
});

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value;
  return {
    "text-danger": strength === "弱",
    "text-warning": strength === "中",
    "text-success": strength === "强",
  };
});

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名长度不能小于3位", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号格式",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;

  try {
    await registerFormRef.value.validate();
    loading.value = true;
    await authStore.registerUser(registerForm);
    ElMessage.success("注册成功");
    router.push("/login");
  } catch (error) {
    ElMessage.error(error.message || "注册失败");
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.register-container {
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

.register-content {
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

.register-content:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-title {
  font-size: 32px;
  color: var(--primary-color);
  font-weight: 700;
  margin-top: 12px;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8);
}

.register-subtitle {
  font-size: 16px;
  color: var(--text-color-light);
  margin-top: 8px;
}

.register-form {
  width: 100%;
  margin-top: 10px;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}

.register-button {
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

.login-link {
  text-align: center;
  margin-top: 24px;
}

.login-link span {
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

/* 表单标签样式 */
:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 15px;
  color: #333333 !important;
  font-weight: 600;
}

/* 图标颜色 */
:deep(.el-input__suffix-inner svg, .el-input__prefix-inner svg) {
  color: var(--primary-color);
}

/* 密码强度指示器 */
.password-strength {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-light);
  display: inline-block;
  padding: 4px 0;
}

.strength-indicator {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-danger {
  color: var(--danger-color);
}

.text-warning {
  color: var(--warning-color);
}

.text-success {
  color: var(--success-color);
}

/* 背景元素 */
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
  opacity: 0.6;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #4A90E2, #56CCF2);
  top: -100px;
  right: -50px;
  filter: blur(30px);
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #F5A623, #F8E71C);
  bottom: -50px;
  left: -60px;
  filter: blur(25px);
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #4CD964, #B8E986);
  top: 60%;
  right: 10%;
  filter: blur(20px);
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

@media screen and (max-width: 480px) {
  .register-content {
    padding: 20px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>
