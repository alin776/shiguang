<template>
  <div class="forgot-password-container">
    <!-- 简约风格背景 -->
    <div class="background-elements">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <div class="forgot-password-content">
      <div class="forgot-password-header">
        <img src="../assets/logo.png" alt="时光" class="logo" />
        <h1 class="forgot-password-title">找回密码</h1>
        <p class="forgot-password-subtitle">请使用邮箱验证码验证身份</p>
      </div>

      <el-form 
        class="forgot-password-form"
        :model="formData" 
        :rules="rules" 
        ref="formRef" 
        label-position="top"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="formData.email" 
            placeholder="请输入邮箱"
            prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item label="验证码" prop="verificationCode">
          <div class="verification-code-container">
            <el-input 
              v-model="formData.verificationCode" 
              placeholder="请输入验证码"
              prefix-icon="Key"
            />
            <el-button 
              type="primary" 
              :disabled="countdown > 0" 
              @click="sendVerificationCode"
              class="verification-code-btn"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="新密码" prop="password">
          <el-input 
            v-model="formData.password" 
            placeholder="请输入新密码"
            type="password"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="formData.confirmPassword" 
            placeholder="请再次输入密码"
            type="password"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <div class="button-container">
          <el-button 
            type="primary" 
            @click="handleSubmit" 
            :loading="loading"
            class="reset-button glow-button pulse-on-click"
            round
          >
            重置密码
          </el-button>
        </div>
      </el-form>
      
      <div class="login-link">
        <span>想起密码了？</span>
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const loading = ref(false);

const formData = ref({
  email: "",
  verificationCode: "",
  password: "",
  confirmPassword: "",
});

const countdown = ref(0);
let countdownTimer = null;

const rules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    {
      type: "email",
      message: "请输入正确的邮箱地址",
      trigger: "blur",
    },
  ],
  verificationCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 4, max: 6, message: "验证码长度不正确", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.value.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    loading.value = true;
    await formRef.value.validate();
    await authStore.resetPasswordWithVerificationCode({
      email: formData.value.email,
      verificationCode: formData.value.verificationCode,
      newPassword: formData.value.password,
    });
    ElMessage.success("密码重置成功，请重新登录");
    router.push("/login");
  } catch (error) {
    ElMessage.error(error.message || "重置密码失败");
  } finally {
    loading.value = false;
  }
};

const sendVerificationCode = async () => {
  try {
    // 验证邮箱
    await formRef.value.validateField("email");
    
    loading.value = true;
    await authStore.sendEmailVerificationCode(formData.value.email, "resetPassword");
    ElMessage.success("验证码已发送至您的邮箱");
    
    // 开始倒计时
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error(error.message || "发送验证码失败");
  } finally {
    loading.value = false;
  }
};

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.forgot-password-container {
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

.forgot-password-content {
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

.forgot-password-content:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 24px;
}

.forgot-password-title {
  font-size: 32px;
  color: var(--primary-color);
  font-weight: 700;
  margin-top: 12px;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8);
}

.forgot-password-subtitle {
  font-size: 16px;
  color: var(--text-color-light);
  margin-top: 8px;
}

.forgot-password-form {
  width: 100%;
  margin-top: 10px;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}

.reset-button {
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

.login-link a {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}

.login-link a:hover {
  color: #2980b9;
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

.verification-code-container {
  display: flex;
  gap: 10px;
}

.verification-code-btn {
  white-space: nowrap;
  min-width: 100px;
  background: linear-gradient(135deg, var(--primary-color), #2980b9);
  border: none;
  color: white;
  font-weight: 500;
}

.verification-code-btn:disabled {
  opacity: 0.7;
  background: linear-gradient(135deg, #8eb7e2, #80a7c5);
}

@media screen and (max-width: 480px) {
  .forgot-password-content {
    padding: 20px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>
