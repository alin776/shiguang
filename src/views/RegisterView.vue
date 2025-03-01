<template>
  <div class="register-container page-container">
    <!-- 添加宇宙粒子背景 -->
    <SpaceBackground />

    <div class="register-header cosmic-header">
      <img src="../assets/logo.png" alt="Logo" class="logo" />
      <h1 class="app-title cosmic-text">时光日历</h1>
      <p>记录每一刻美好时光</p>
    </div>

    <div class="register-form tech-card enhanced-border">
      <h2 class="form-title cosmic-text">创建新账号</h2>

      <el-form
        :model="registerForm"
        :rules="rules"
        ref="registerFormRef"
        label-position="top"
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
          <el-button
            class="register-button glow-button"
            @click="handleRegister"
            :loading="loading"
            round
          >
            注册
          </el-button>
          <el-button class="back-button tech-button" @click="goToLogin" round>
            返回登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { ElMessage } from "element-plus";
import SpaceBackground from "./calendar/components/SpaceBackground.vue";

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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(18, 18, 30, 0.9);
  color: white;
  position: relative;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
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

.register-header p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.register-form {
  width: 100%;
  max-width: 450px;
  background: rgba(30, 30, 40, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(147, 51, 234, 0.2);
  padding: 30px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.form-title {
  font-size: 24px;
  margin-top: 0;
  margin-bottom: 24px;
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

.password-strength {
  margin-top: 8px;
  font-size: 12px;
  padding: 4px 10px;
  display: inline-block;
  border-radius: 12px;
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(147, 51, 234, 0.3);
}

.strength-indicator {
  font-weight: bold;
  margin-left: 4px;
}

.tech-badge {
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.text-danger {
  color: #ff4d6d;
  text-shadow: 0 0 8px rgba(255, 77, 109, 0.6);
}

.text-warning {
  color: #ffd166;
  text-shadow: 0 0 8px rgba(255, 209, 102, 0.6);
}

.text-success {
  color: #06d6a0;
  text-shadow: 0 0 8px rgba(6, 214, 160, 0.6);
}

.register-button {
  height: 44px;
  font-size: 16px;
  margin-right: 10px;
  background: linear-gradient(45deg, #8b5cf6, #d946ef);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4);
  transition: all 0.3s ease;
  color: white;
  min-width: 120px;
}

.back-button {
  height: 44px;
  font-size: 16px;
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid rgba(147, 51, 234, 0.4);
  color: white;
  min-width: 120px;
}

.glow-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(147, 51, 234, 0.6);
}

.glow-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(147, 51, 234, 0.4);
}

.tech-button:hover {
  background: rgba(147, 51, 234, 0.2);
  border-color: rgba(147, 51, 234, 0.6);
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.3);
}

/* 输入框样式调整 */
:deep(.el-input__wrapper) {
  background-color: transparent !important;
  border: 1px solid rgba(147, 51, 234, 0.3) !important;
  box-shadow: none !important;
  border-radius: 8px !important;
  height: 44px;
  backdrop-filter: none !important; /* 禁用任何背景模糊效果 */
}

:deep(.el-input__inner) {
  color: white !important;
}

/* 占位符文本颜色 */
:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* 输入提示文本颜色 */
:deep(.el-input__placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* 密码显示/隐藏图标 */
:deep(.el-input__suffix-inner svg) {
  color: rgba(147, 51, 234, 0.8);
  filter: drop-shadow(0 0 2px rgba(147, 51, 234, 0.4));
}

/* 表单标签样式 */
:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
}

@media screen and (max-width: 480px) {
  text-align: center;

  .register-button,
  .back-button {
    width: 100%;
    margin: 8px 0;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>
