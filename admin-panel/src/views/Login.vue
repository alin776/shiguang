<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">时光App管理后台</h1>
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        label-width="0" 
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名" 
            prefix-icon="el-icon-user"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            prefix-icon="el-icon-lock"
            size="large" 
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            :loading="loading" 
            type="primary" 
            class="login-button" 
            size="large" 
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loginForm = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const loginFormRef = ref(null)

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    // 尝试登录
    const success = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (success) {
      ElMessage.success('登录成功')
      router.push('/')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.login-container {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
}

.login-form {
  margin-top: 30px;
}

.login-button {
  width: 100%;
}
</style> 