<template>
  <div class="change-password-page">
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>修改密码</h2>
    </div>

    <div class="form-container">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          class="submit-btn"
          @click="handleSubmit"
          :loading="loading"
        >
          确认修改
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const loading = ref(false);

const form = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const rules = {
  oldPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== form.value.newPassword) {
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
    await authStore.changePassword({
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword,
    });
    ElMessage.success("密码修改成功");
    router.back();
  } catch (error) {
    ElMessage.error(error.message || "修改失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.change-password-page {
  min-height: 100vh;
  background: #f6f7f9;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  color: #333;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
}

.page-header h2 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.form-container {
  padding: 24px 16px;
  max-width: 400px;
  margin: 0 auto;
}

:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 15px;
  color: #606266;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  margin-top: 32px;
  height: 40px;
  font-size: 16px;
  border-radius: 20px;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .change-password-page {
    background: #1a1a1a;
  }

  .page-header {
    background: #242424;
  }

  .page-header h2 {
    color: #fff;
  }

  .back-icon {
    color: #fff;
  }

  :deep(.el-form-item__label) {
    color: #909399;
  }
}

/* 响应式设计 */
@media screen and (min-width: 768px) {
  .form-container {
    padding: 32px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-top: 32px;
  }

  @media (prefers-color-scheme: dark) {
    .form-container {
      background: #242424;
    }
  }
}
</style>
