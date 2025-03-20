<template>
  <div class="register-container">
    <div class="background-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>
    
    <div class="register-card">
      <div class="form-header">
        <h1 class="title">创建新账号</h1>
        <p class="subtitle">加入我们，开启全新旅程</p>
      </div>
      
      <el-form
        :model="registerForm"
        :rules="rules"
        ref="registerFormRef"
        label-position="left"
        label-width="80px"
        class="register-form"
      >
        <div class="form-row">
          <el-form-item label="用户名" prop="username">
            <div class="input-wrapper">
              <el-input v-model="registerForm.username" placeholder="请输入用户名" />
            </div>
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="邮箱" prop="email">
            <div class="input-group">
              <div class="input-wrapper">
                <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
              </div>
              <el-button 
                class="code-button"
                :disabled="cooldown > 0" 
                @click="sendVerificationCode"
                :loading="sendingCode"
              >
                {{ cooldown > 0 ? `${cooldown}秒` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="验证码" prop="verificationCode">
            <div class="input-wrapper">
              <el-input 
                v-model="registerForm.verificationCode" 
                placeholder="请输入验证码"
              />
            </div>
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="手机号" prop="phone">
            <div class="input-wrapper">
              <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
            </div>
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="密码" prop="password">
            <div class="input-wrapper">
              <el-input
                v-model="registerForm.password"
                type="password"
                show-password
                placeholder="请输入密码"
              />
            </div>
            <div class="password-strength-wrapper" v-if="registerForm.password">
              <div class="strength-label">密码强度：</div>
              <div class="strength-box" :class="passwordStrengthClass">
                <span>{{ passwordStrength }}</span>
              </div>
            </div>
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="确认密码" prop="confirmPassword">
            <div class="input-wrapper">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入密码"
              />
            </div>
          </el-form-item>
        </div>
        
        <button 
          class="submit-button" 
          @click.prevent="handleRegister"
          :class="{ 'loading': loading }"
        >
          <span class="button-text">注册账号</span>
          <span class="button-loader" v-if="loading"></span>
        </button>
      </el-form>

      <div class="login-link">
        <span>已有账号？</span>
        <a @click="goToLogin" class="link-text">返回登录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { ElMessage } from "element-plus";
import axios from "axios";
import { API_BASE_URL } from "../config";

const router = useRouter();
const authStore = useAuthStore();
const registerFormRef = ref(null);
const loading = ref(false);
const sendingCode = ref(false);
const cooldown = ref(0);
let cooldownTimer = null;

const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
  verificationCode: ""
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
  if (strength === "弱") return "strength-weak";
  if (strength === "中") return "strength-medium";
  if (strength === "强") return "strength-strong";
  return "";
});

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名长度不能小于3位", trigger: "blur" },
    { max: 8, message: "用户名长度不能超过8位", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  verificationCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { pattern: /^\d{6}$/, message: "验证码必须是6位数字", trigger: "blur" },
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

// 发送验证码
const sendVerificationCode = async () => {
  try {
    // 验证邮箱格式
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(registerForm.email)) {
      ElMessage.warning("请输入正确的邮箱格式");
      return;
    }
    
    sendingCode.value = true;
    
    // 发送获取验证码请求
    await axios.post(`${API_BASE_URL}/api/users/send-verification-code`, {
      email: registerForm.email
    });
    
    ElMessage.success("验证码已发送到您的邮箱");
    
    // 启动倒计时
    cooldown.value = 60;
    cooldownTimer = setInterval(() => {
      cooldown.value--;
      if (cooldown.value <= 0) {
        clearInterval(cooldownTimer);
      }
    }, 1000);
  } catch (error) {
    let errorMsg = "发送验证码失败";
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message;
    }
    ElMessage.error(errorMsg);
  } finally {
    sendingCode.value = false;
  }
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

// 清理定时器
onBeforeUnmount(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }
});
</script>

<style scoped>
/* 导入字体 */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 10px;
  background-color: #f8fbfd;
  font-family: 'Poppins', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow: hidden;
}

/* 背景形状 */
.background-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
  filter: blur(50px);
}

.shape-1 {
  width: 200px;
  height: 200px;
  background-color: #a8e6cf; /* 薄荷绿 */
  top: -80px;
  left: -100px;
  animation: float 8s ease-in-out infinite;
}

.shape-2 {
  width: 180px;
  height: 180px;
  background-color: #dcedc1; /* 浅黄绿 */
  bottom: -80px;
  right: -80px;
  animation: float 7s ease-in-out infinite 1s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background-color: #ffd3b6; /* 樱花粉 */
  bottom: 80px;
  left: 15%;
  animation: float 6s ease-in-out infinite 0.5s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  background-color: #ffaaa5; /* 珊瑚粉 */
  top: 10%;
  right: 10%;
  animation: float 9s ease-in-out infinite 1.5s;
}

@keyframes float {
  0% {
    transform: translatey(0px);
  }
  50% {
    transform: translatey(-20px);
  }
  100% {
    transform: translatey(0px);
  }
}

/* 卡片样式 */
.register-card {
  position: relative;
  width: 100%;
  max-width: 450px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  padding: 25px 20px;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: cardEntrance 0.6s ease-out;
}

.register-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单头部 */
.form-header {
  text-align: center;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  background: linear-gradient(to right, #58c3af, #4a9eff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

/* 表单样式 */
.register-form {
  width: 100%;
}

.form-row {
  margin-bottom: 15px;
}

/* 表单项样式 */
:deep(.el-form-item__label) {
  padding: 0 8px 0 0;
  line-height: 40px;
  font-size: 14px;
  color: #555 !important;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group .input-wrapper {
  flex: 1;
}

/* 输入框样式 */
:deep(.el-input .el-input__wrapper) {
  background-color: #f9fafc !important;
  box-shadow: none !important;
  border: 1px solid #edf1f7 !important;
  border-radius: 10px !important;
  height: 42px;
  transition: all 0.3s ease;
}

:deep(.el-input .el-input__wrapper:hover),
:deep(.el-input .el-input__wrapper:focus-within) {
  border-color: #a8e6cf !important;
  box-shadow: 0 0 0 2px rgba(168, 230, 207, 0.2) !important;
}

:deep(.el-input .el-input__inner) {
  color: #4a5568;
  font-size: 15px;
}

:deep(.el-input .el-input__inner::placeholder) {
  color: #a0aec0;
}

/* 错误提示样式 */
:deep(.el-form-item__error) {
  color: #ff6b6b;
  font-size: 12px;
  font-weight: 500;
  padding-left: 5px;
}

/* 表单验证失败时的输入框样式 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #ff6b6b !important;
  box-shadow: 0 0 0 1px rgba(255, 107, 107, 0.1) !important;
}

/* 密码强度样式 */
.password-strength-wrapper {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.strength-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 20px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: normal;
  color: #ffffff;
}

.strength-weak {
  background-color: #f56c6c;
}

.strength-medium {
  background-color: #e6a23c;
}

.strength-strong {
  background-color: #67c23a;
}

/* 获取验证码按钮 */
.code-button {
  height: 42px;
  min-width: 100px;
  border-radius: 10px !important;
  background: linear-gradient(135deg, #a8e6cf, #58cedd) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(88, 206, 221, 0.2);
}

.code-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(88, 206, 221, 0.3);
}

.code-button:active {
  transform: translateY(0);
}

.code-button:disabled {
  background: #e2e8f0 !important;
  color: #a0aec0 !important;
  box-shadow: none;
  transform: none;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #58c3af, #4a9eff);
  border: none;
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin-top: 15px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 158, 255, 0.2);
}

.submit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: all 0.5s ease;
}

.submit-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(74, 158, 255, 0.3);
}

.submit-button:hover::before {
  left: 100%;
}

.submit-button:active {
  transform: translateY(0);
}

.button-text {
  position: relative;
  z-index: 2;
}

/* 按钮加载状态 */
.loading .button-text {
  opacity: 0;
}

.button-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 登录链接 */
.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #718096;
}

.link-text {
  color: #4a9eff;
  text-decoration: none;
  font-weight: 500;
  margin-left: 5px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.link-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #4a9eff;
  transition: width 0.3s ease;
}

.link-text:hover::after {
  width: 100%;
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .register-card {
    padding: 20px 16px;
    margin: 10px;
  }
  
  .title {
    font-size: 22px;
  }
  
  .subtitle {
    font-size: 13px;
  }
  
  :deep(.el-input .el-input__wrapper) {
    height: 40px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
    line-height: 36px;
  }
  
  .code-button {
    height: 40px;
    min-width: 90px;
    font-size: 12px;
  }
  
  .submit-button {
    height: 44px;
    font-size: 14px;
  }
  
  .form-row {
    margin-bottom: 12px;
  }
  
  .password-strength-wrapper {
    margin-top: 6px;
  }
}
</style>
